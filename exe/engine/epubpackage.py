'''
Represents an EPUB file as it's used in the editing process

@author: mike
'''

import os.path
from exe.engine.epubitem import EPUBItem
from exe.engine.epubopf import EPUBOPF
from exe.engine.tincanxmlmanager import TinCanXMLManager
from exe.engine.path           import Path, TempDirPath, toUnicode
import zipfile
import time
import uuid
from lxml import etree
from exe                         import globals as G


class EPUBPackage(object):
    '''
    classdocs
    '''
    
    FILENAME_RESERVED_CHARS = ['/','\\', '?', '%', '*', ':', '|', '"', '<', '>']

    IDEVICE_CONTAINER_FINDERS = [".//{%s}*[@data-role='idevicecontainer']",
                                 ".//{%s}*[@role='main']", 
                                 ".//{%s}*[@id='main']" ] 

    UPDATE_ALL_ON_OPEN = False

    @classmethod
    def load(cls, filename):
        epub_handle = EPUBPackage(filename = filename)
        
        return epub_handle
    
    @classmethod
    def get_idevice_container_el(self, page_el):
        """Given the page element: find the element that contains idevices"""
        result = None
        ns_xhtml = page_el.nsmap.get(None)
        for finder in EPUBPackage.IDEVICE_CONTAINER_FINDERS:
            result = page_el.find(finder % ns_xhtml)
            if result is not None:
                break
        
        return result

    @classmethod
    def find_idevice_dir(self, idevice_type, idevices_src_dir = None):
        """
        Return where the given idevice is located if it's in the user_idevice_dir or common_idevice_dir, or none if not found
        Parameters
        idevice_type - str
            the id of the idevice itself e.g. com.ustadmobile.helloidevice
        """
        idevice_dir = None
        
        if idevices_src_dir is None:
            idevices_src_dir = G.application.config.configDir/"idevices"
        
        if os.path.exists(idevices_src_dir) and os.path.isfile(Path(idevices_src_dir)/idevice_type/"idevice.xml"):
            idevice_dir = Path(idevices_src_dir)/idevice_type
        
        return idevice_dir

    def __init__(self, filename = None, name = None):
        '''
        Constructor
        '''
        self.filename = filename
        if name is not None:
            self.name = name
        else:
            self.name = os.path.basename(filename)
        
        self.resourceDir = TempDirPath()
        
        #TODO: inspect filenames for untrusted entries e.g. .. and /
        zippedFile = zipfile.ZipFile(filename, "r")
        for fn in zippedFile.namelist():
            #check to make sure that we have the required directories
            Dir = None
            if fn[-1:] == '/':
                Dir = Path(self.resourceDir/fn)
            else:
                Dir = Path(self.resourceDir/os.path.dirname(fn))
            
            if not Dir.exists():
                Dir.makedirs()
                
                
            Fn = Path(self.resourceDir/fn)
            
            if not Fn.isdir():
                outFile = open(self.resourceDir/fn, "wb")
                outFile.write(zippedFile.read(fn))
                outFile.flush()
                outFile.close()
                file_info = zippedFile.getinfo(fn)
                mod_time =time.mktime(file_info.date_time+(0,0,-1))
                os.utime(self.resourceDir/fn, (time.time(), mod_time))
        
        #update files here...
        
        ocf_str = open(self.resourceDir/"META-INF/container.xml", 'r').read()
        self.ocf = EPUBOCF(ocf_doc = ocf_str)
        self.opfs = []
        for container in self.ocf.root_containers:
            if container.media_type == "application/oebps-package+xml":
                opf_path = os.path.join(self.resourceDir, container.full_path)
                opf_str = open(opf_path, 'r').read()
                self.opfs.append(EPUBOPF(opf_path, opf_str = opf_str, 
                                         container_path = container.full_path, package = self)) 
        
        
        # for now we handle one OPF in a package
        self.main_opf = self.opfs[0]
        self.main_manifest = self.main_opf.manifest
        self.root = self.main_opf.get_navigation()
        
        if EPUBPackage.UPDATE_ALL_ON_OPEN:
            self.main_opf.resource_manager.update_all_pages()
        
        self.currentNode = self.root
        self.tincan_manager = TinCanXMLManager(self)
        self.isChanged = False
    
    def gegenerate_id(self):
        """Generates a new OPF ID"""
        self.main_opf.set_opf_id(str(uuid.uuid4()))
    
    def get_id(self):
        return self.main_opf.get_opf_id()
    
    def set_id(self, id):
        self.main_opf.set_opf_id(id)
        self.tincan_manager.set_base_id("epub:" + id)
        
    id = property(get_id, set_id)
    
    def get_title(self):
        return self.main_opf.title
    
    def set_title(self, title):
        self.main_opf.title = title
    
    title = property(get_title, set_title)
    
    def save(self, filename=None, tempFile=False):
        if filename:
            filename = Path(filename)
            # If we are being given a new filename...
            # Change our name to match our new filename
            name = filename.splitpath()[1]
            if not tempFile:
                self.name = name.basename().splitext()[0]
        elif self.filename:
            # Otherwise use our last saved/loaded from filename
            filename = Path(self.filename)
        else:
            # If we don't have a last saved/loaded from filename,
            # raise an exception because, we need to have a new
            # file passed when a brand new package is saved
            raise AssertionError(u'No name passed when saving a new package')
        
        if not tempFile:
            # Update our new filename for future saves
            self.filename = filename
            filename.safeSave(self.doSave, _('SAVE FAILED!\nLast succesful save is %s.'))
            self.isChanged = False
            #self.updateRecentDocuments(filename)
    
    def doSave(self, file_obj):
        zip_fd = zipfile.ZipFile(file_obj, "w", zipfile.ZIP_DEFLATED)
        for root, dirs, files in os.walk(self.resourceDir):
            for file in files:
                file_path = os.path.join(root, file)
                zip_fd.write(file_path, os.path.relpath(file_path, self.resourceDir)) 
        
        zip_fd.close()
        
    def findNode(self, node_id):
        return self.root.find_node(node_id)
    
    @staticmethod
    def sanitize_for_filename(name):
        """Replace any prohibited characters with an underscore and hex
        code : leaving the result unique and compliant with most file
        systems"""
        new_name = ""
        for index in range(len(name)):
            current_char = name[index:index+1]
            if current_char in EPUBPackage.FILENAME_RESERVED_CHARS:
                new_name += "_" + current_char.encode("hex")
            elif current_char.isspace():
                new_name += "_"
            else:
                new_name += current_char
                
        return new_name
    
    
class EPUBOCF(object):
    
    NAMESPACE_OCF = "urn:oasis:names:tc:opendocument:xmlns:container"
            
    def __init__(self, ocf_doc = None):
        self.root_containers = []
        if ocf_doc is not None:
            self.parseXML(ocf_doc)
    

    def parseXML(self, ocf_doc_str):
        doc = etree.fromstring(ocf_doc_str)
        root_container_els = doc.findall(".//{%s}rootfile" % EPUBOCF.NAMESPACE_OCF)
        for root in root_container_els:
            self.root_containers.append(EPUBOCFRoot(root.get('full-path'),
                                            root.get('media-type')))
    
        
class EPUBOCFRoot(object):
        
    def __init__(self, full_path, media_type):
        self.full_path = full_path
        self.media_type = media_type
        

        