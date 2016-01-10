'''
Represents an EPUB file as it's used in the editing process

@author: mike
'''

import os.path
from exe.engine.epubitem import EPUBItem
from exe.engine.epubopf import EPUBOPF
from exe.engine.path           import Path, TempDirPath, toUnicode
import zipfile
from lxml import etree

class EPUBPackage(object):
    '''
    classdocs
    '''
    
    FILENAME_RESERVED_CHARS = ['/','\\', '?', '%', '*', ':', '|', '"', '<', '>']

    @classmethod
    def load(cls, filename):
        epub_handle = EPUBPackage(filename = filename)
        
        return epub_handle


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
        zippedFile.extractall(self.resourceDir)
        
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
        self.currentNode = self.root
        self.isChanged = False
    
    
        
        
    
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
        

        