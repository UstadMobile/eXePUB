'''
Created on Dec 28, 2015

@author: mike
'''

from lxml import etree
import os.path

class EPUBOPF(object):
    '''
    classdocs
    '''
    
    NAMESPACE_OPF = "http://www.idpf.org/2007/opf"

    '''Maximum number of suffixes we will go through to find a free
    filename
    '''
    FIND_FILENAME_MAX_ATTEMPTS = 500


    def __init__(self, href, opf_str = None, container_path = None, package = None):
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
        self.package = package
    
    def save(self):
        package_file = open(self.href, "w")
        package_file.write(etree.tostring(self.package_el, encoding = "UTF-8", pretty_print = True))
        package_file.flush()
        package_file.close()
    
    def set_package_changed(self, changed = True):
        """Set the package changed flag""" 
        if self.package is not None:
            self.package.isChanged = changed
    
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
        
    def add_item_to_manifest(self, item_id, media_type, href, properties = None, auto_save = True):
        """Adds an item to the OPF file manifest
        Parameters
        ----------
        item_id : String
            As per id attribute - must be unique
        media_type : String
            
        """
        manifest_el = self.package_el.find("./{%s}manifest" % EPUBOPF.NAMESPACE_OPF)
        new_item_el = etree.SubElement(manifest_el, "{%s}item" % EPUBOPF.NAMESPACE_OPF, 
                                       href = href, id = item_id)
        new_item_el.set("media-type", media_type)
        if auto_save:
            self.save()
        
        return new_item_el
        
    
    def handle_item_renamed(self, old_href, new_href, auto_save = True):
        """Handle when an item in the manifest has been renamed
        """
        item_el = self.package_el.find(".//{%s}item[@href='%s']" % (EPUBOPF.NAMESPACE_OPF, old_href))
        itemrefs = self.package_el.find(".//{%s}itemref[@idref='%s']" % (EPUBOPF.NAMESPACE_OPF, item_el.get("id")))
        item_el.set("href", new_href)
        new_id = self.get_id_for_href(new_href)
        item_el.set("id", new_id)
        if itemrefs is not None:
            for item in itemrefs:
                item.set("idref", new_id)
        
        if auto_save:
            self.save()
    
    def delete_item_by_href(self, href, auto_save = True):
        """Delete an item from the manifest and removes the file from resourceDir"""
        item_el = self.package_el.find(".//{%s}item[@href='%s']" % (EPUBOPF.NAMESPACE_OPF, href))
        if item_el is not None:
            item_id = item_el.get("id")
            item_el.getparent().remove(item_el)
            
            item_path = os.path.join(os.path.dirname(self.href), href)
            if os.path.isfile(item_path):
                os.remove(item_path)
            
            spine_itemref = self.package_el.findall(".//{%s}itemref[@idref='%s']")
            for itemref in spine_itemref:
                spine_itemref.getparent().remove(itemref)
            
            if auto_save:
                self.save()
        
    def get_id_for_href(self, href):
        
        return href
        
    def find_free_filename(self, basename, extension):
        """Find a free filename for the given basename and extension
        if already taken generate a new value in the form of
        basename_NUM.extension
        Parameters
        ----------
        basename : string
            The file basename to use e.g. "mypage"
        extension : string
            The end extension to use including . e.g. ".xhtml"
        
        """
        manifest_items = self.manifest
        
        suffix = ""
        for attempt_count in range(0, EPUBOPF.FIND_FILENAME_MAX_ATTEMPTS):
            current_filename = basename + suffix + extension
            
            name_taken = False
            for id, item in manifest_items.iteritems():
                if item.href == current_filename:
                    name_taken = True
                    break
            
            if not name_taken:
                return current_filename
            
            suffix = "_%s" % str(attempt_count)
        
        return None
        
    
    def get_navigation(self):
        if self.navigation_doc:
            return self.navigation_doc
        
        if not self.nav_el_id:
            manifest = self.manifest
        
        nav_el = self.package_el.find(".//*[@id='%s']" % self.nav_el_id)
        
        nav_doc_path = os.path.join(os.path.dirname(self.href), nav_el.get("href"))
        nav_doc_str = open(nav_doc_path).read()
        from exe.engine.epubnav import EPUBNavDocument
        self.navigation_doc = EPUBNavDocument(self, EPUBOPFItem(nav_el), nav_doc_str, 
                                              file_path = nav_doc_path)
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
        