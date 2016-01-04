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
        self.currentNode = EPUBItem("index", "index.xhtml", "text/html")
        ocf_str = open(self.resourceDir/"META-INF/container.xml", 'r').read()
        self.ocf = EPUBOCF(ocf_doc = ocf_str)
        self.opfs = []
        for container in self.ocf.root_containers:
            if container.media_type == "application/oebps-package+xml":
                opf_path = os.path.join(self.resourceDir, container.full_path)
                opf_str = open(opf_path, 'r').read()
                self.opfs.append(EPUBOPF(opf_path, opf_str = opf_str, 
                                         container_path = container.full_path)) 
        
        
        # for now we handle one OPF in a package
        self.main_opf = self.opfs[0]
        self.main_manifest = self.main_opf.manifest
        self.root = self.main_opf.get_navigation()
        
    def findNode(self, node_id):
        return self.root.find_node(node_id)

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
        

        