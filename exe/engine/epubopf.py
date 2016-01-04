'''
Created on Dec 28, 2015

@author: mike
'''

from lxml import etree
import os.path
from exe.engine.epubnav import EPUBNavDocument

class EPUBOPF(object):
    '''
    classdocs
    '''
    
    NAMESPACE_OPF = "http://www.idpf.org/2007/opf"


    def __init__(self, href, opf_str = None, container_path = None):
        '''
        Parameters
        ----------
        href : string
           Absolute file path of this opf through which it is being opened.
        
        Keyword arguments:
            opf_str -- if available the contents of the OPF file itself to parse (Default None)
            container_path -- the path of this opf within the epub container (Default None)
        '''
        
        # The etree root element
        if opf_str:
            self.package_el = etree.fromstring(opf_str)
        else:
            self.package_el = None # this could be construction of a blank item
        
        self.href = href
        self.nav_el_id = None
        self.navigation_doc = None
        
        self.container_path = container_path
        
    @property
    def manifest(self):
        item_els =self.package_el.findall("./{%(ns)s}manifest/{%(ns)s}item" %  
                                          {'ns' : EPUBOPF.NAMESPACE_OPF})
        manifest = {}
        for item in item_els:
            new_item = EPUBOPFItem(item)
            manifest[item.get("id")] = new_item
            if new_item.is_nav():
                self.nav_el_id = item.get("id") 
            
            
        return manifest
        
    
        
    
    def get_navigation(self):
        if self.navigation_doc:
            return self.navigation_doc
        
        if not self.nav_el_id:
            manifest = self.manifest
        
        nav_el = self.package_el.find(".//*[@id='%s']" % self.nav_el_id)
        
        nav_doc_path = os.path.join(os.path.dirname(self.href), nav_el.get("href"))
        nav_doc_str = open(nav_doc_path).read()
        self.navigation_doc = EPUBNavDocument(self, EPUBOPFItem(nav_el), nav_doc_str)
        return self.navigation_doc
    
    def get_item_by_href(self, href):
        for id, item in self.manifest.iteritems():
            if item.href == href:
                return item
            
        return None
                
    

class EPUBOPFItem(object):
    
    def __init__(self, item_el):
        """
        Makes a new EPUBOPFItem that is backed by an etree Element
        Parameters
        ----------
        item_el : lxml.etree.Element
            The etree element for the item tag that this item represents
        """
        self.item_el = item_el
        
    
    @property
    def id(self):
        return self.item_el.get("id")
    
    @property
    def media_type(self):
        return self.item_el.get("media-type")
    
    @property
    def href(self):
        return self.item_el.get("href")
    
    @property
    def properties(self):
        """Return the properties as a list if there are any
        """
        if self.item_el.get("properties"):
            return self.item_el.get("properties").split()
        else:
            return []
    
    def is_nav(self):
        return "nav" in self.properties
    
    def is_scripted(self):
        return "scripted" in self.properties
        