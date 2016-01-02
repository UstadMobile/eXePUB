'''
Created on Dec 28, 2015

@author: mike
'''

import xml.dom.minidom
import os.path
from exe.engine.epubnav import EPUBNavDocument

class EPUBOPF(object):
    '''
    classdocs
    '''


    def __init__(self, href, opf_str = None):
        '''
        Constructor
        '''
        self.href = href
        self.spine = []
        self.manifest = {}
        self.navigation_item = None
        if opf_str is not None:
            self.parseXML(opf_str)
            
        self.navigation_doc = None
    
    def parseXML(self, xml_str):
        xml_doc = xml.dom.minidom.parseString(xml_str)
        item_els = xml_doc.getElementsByTagName("item")
        for item in item_els:
            id = item.attributes['id'].value
            
            properties = None
            if item.hasAttribute('properties'):
                properties = item.attributes['properties'].value.split()
            else:
                properties = []
            
            self.manifest[id] = EPUBOPFItem(id, item.attributes['href'].value, 
                                    item.attributes['media-type'].value, properties)
            
            if properties is not None and "nav" in properties:
                self.navigation_item = self.manifest[id]
        
        
    
    def get_navigation(self):
        if self.navigation_doc:
            return self.navigation_doc
        
        nav_doc_path = os.path.join(os.path.dirname(self.href), self.navigation_item.href)
        nav_doc_str = open(nav_doc_path).read()
        self.navigation_doc = EPUBNavDocument(self, self.navigation_item, nav_doc_str)
        return self.navigation_doc
    
    def get_item_by_href(self, href):
        for id, item in self.manifest.iteritems():
            if item.href == href:
                return item
            
        return None
                
    

class EPUBOPFItem(object):
    
    def __init__(self, id, href, media_type, properties = []):
        self.id = id
        self.media_type = media_type
        self.href = href 
        self.properties = properties
        
    def is_nav(self):
        return "nav" in self.properties
    
    def is_scripted(self):
        return "scripted" in self.properties
        