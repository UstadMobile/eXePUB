'''
Created on Dec 28, 2015

@author: mike
'''

from lxml import etree
import os.path
import shutil
from exe.engine.epubresourcemanager import EPUBResourceManager
import mimetypes
from bs4 import BeautifulSoup

class EPUBOPF(object):
    '''
    classdocs
    '''
    
    NAMESPACE_OPF = "http://www.idpf.org/2007/opf"
    
    NAMESPACE_DC = "http://purl.org/dc/elements/1.1/"

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
            
            #check for a title - old versions of eXe made invalid opfs with no title
            if self._get_title_el() is None:
                metadata_el = self.package_el.find(".//{%s}metadata" % EPUBOPF.NAMESPACE_OPF)
                title_el = etree.SubElement(metadata_el, "{%s}title" % EPUBOPF.NAMESPACE_DC)
                title_el.text = "Package"
            
        else:
            self.package_el = None # this could be construction of a blank item
        
        self.href = href
        self.nav_el_id = None
        self.navigation_doc = None
        
        self.container_path = container_path
        self.package = package
        self.resource_manager = EPUBResourceManager(self.package, self)
    
    def save(self):
        package_file = open(self.href, "w")
        package_file.write(etree.tostring(self.package_el, encoding = "UTF-8", pretty_print = True))
        package_file.flush()
        package_file.close()
    
    def set_package_changed(self, changed = True):
        """Set the package changed flag""" 
        if self.package is not None:
            self.package.isChanged = changed
    
    def get_opf_id(self):
        identifier_el = None
        unique_id = self.package_el.get("unique-identifier")
        if unique_id is not None:
            identifier_el = self.package_el.find(".//{%s}identifier[@id='%s']" % (EPUBOPF.NAMESPACE_DC, unique_id))
        else:
            identifier_el = self.package_el.find(".//{%s}identifier" % EPUBOPF.NAMESPACE_DC)
        
        return identifier_el.text
    
    def _get_title_el(self):
        return self.package_el.find(".//{%s}title" % (EPUBOPF.NAMESPACE_DC))
    
    def get_title(self):
        return self._get_title_el().text
    
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
    
    def add_file(self, src_file, path_in_package, auto_update = False, media_type = None, auto_save = True):
        """
        Adds an external file to the manifest in the given location
        
        path_in_package _MAY_ be adjusted in case such a file already exists
        auto_update - If true and the package already contains a file of the same name: 
            then we will overwrite it, otherwise we should look for a new name within
            the package
        
        Returns a tuple containing the manifest item id and the path in package 
        """
        
        if media_type is None:
            media_type = mimetypes.guess_type(path_in_package)[0]
        
        dst_dir = os.path.join(os.path.dirname(self.href), os.path.dirname(path_in_package))
        if not os.path.isdir(dst_dir):
            os.makedirs(dst_dir)
        
        shutil.copy2(src_file, os.path.join(os.path.dirname(self.href), path_in_package))
        new_file = True
        if auto_update:
            if self.contains_href(path_in_package):
                new_file = False
        
        manifest_id = None
        if new_file:
            manifest_id = self.get_id_for_href(path_in_package)
            self.add_item_to_manifest(manifest_id, media_type, path_in_package)
        else:
            manifest_id = self.get_item_by_href(path_in_package)
        
        return (manifest_id, path_in_package)
        
    
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
        self.delete_item(item_el, auto_save = auto_save)
        
                
    def delete_item_by_id(self, item_id, auto_save = True):
        item_el = self.package_el.find(".//{%s}item[@id='%s']" % (EPUBOPF.NAMESPACE_OPF, item_id))
        self.delete_item(item_el, auto_save = auto_save)
    
    def delete_item(self, item_el, auto_save = True):
        item_id = item_el.get("id")
        item_el.getparent().remove(item_el)
        
        item_path = os.path.join(os.path.dirname(self.href), item_el.get("href"))
        if os.path.isfile(item_path):
            os.remove(item_path)
        
        spine_itemref = self.package_el.findall(".//{%s}itemref[@idref='%s']")
        for itemref in spine_itemref:
            spine_itemref.getparent().remove(itemref)
        
        if auto_save:
            self.save()
        
    def get_id_for_href(self, href):
        #TODO: tidy this into a valid id
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
    
    def get_item_by_id(self, id):
        for item_id, item in self.manifest.iteritems():
            if item_id == id:
                return item
            
        return None
       
    def contains_href(self, href):
        href_el = self.package_el.find(".//{%s}item[@href='%s']" % (EPUBOPF.NAMESPACE_OPF, href))
        return href_el is not None     
        
    def _get_item_path(self, item_id):
        """Return the location on the filesystem of the given item id"""
        item = self.get_item_by_id(item_id)
        if item is not None:
            return os.path.join(os.path.dirname(self.href), item.href)
        else:
            return None
    
    
    def _get_page_html_el(self, page_id):
        return etree.parse(self._get_item_path(page_id)).getroot()
    
    def _save_page_html(self, page_id, html_el):
        page_fd = open(self._get_item_path(page_id), "w")
        EPUBResourceManager.clean_html_el(html_el)  
        page_fd.write(etree.tostring(html_el, encoding = "UTF-8", pretty_print = True))
        page_fd.flush()
        page_fd.close()
        
        
    def set_page_idevice_html(self, page_id, idevice_id, html):
        """Save the actual HTML content of the idevice"""
        page_path = self._get_item_path(page_id)
        page_html_el = self._get_page_html_el(page_id)
        ns_xhtml = page_html_el.nsmap.get(None)
        idevice_el = page_html_el.find('.//{%s}*[@id="id%s"]' % (ns_xhtml, idevice_id))
        
        #empty the eleement as it is now
        for child in idevice_el:
            idevice_el.remove(child)
        
        #process and look for resources that need added to the package
        html = self.resource_manager.process_previewed_images(html, page_id, idevice_id)
        
        #pack it into a single element so it parses OK
        html = "<div xmlns=\"%s\">%s</div>" % (ns_xhtml, html)
        
        soup = BeautifulSoup(html)        
        new_el = etree.fromstring(soup.find("div").prettify(formatter="xml"))
        
        #the formatter will add white space - which messes up text areas
        for textel in new_el.findall(".//{%s}textarea"):
            if textel.text:
                textel.text = textel.text.strip()
            
        for el in new_el:
            idevice_el.append(el)
        
        self._save_page_html(page_id, page_html_el)
        
        
    def delete_idevice_from_page(self, page_id, idevice_id):
        page_html_el = self._get_page_html_el(page_id)
        ns_xhtml = page_html_el.nsmap.get(None)
        idevice_el = page_html_el.find('.//{%s}*[@id="id%s"]' % (ns_xhtml, idevice_id))
        idevice_el.getparent().remove(idevice_el)
        self._save_page_html(page_id, page_html_el)
    
    def update_spine(self, auto_save = True):
        spine_el = self.package_el.find(".//{%s}spine" % EPUBOPF.NAMESPACE_OPF)
        for itemref in spine_el:
            spine_el.remove(itemref)
        
        self.add_navitem_to_spine(spine_el, self.get_navigation(), children_only=True)
        
        if auto_save:
            self.save()
    
    def add_navitem_to_spine(self, spine_el, nav_item, children_only = False):
        if not children_only:
            itemref_el = etree.SubElement(spine_el, "{%s}itemref" % EPUBOPF.NAMESPACE_OPF)
            itemref_el.set("idref", nav_item.epub_item.id)
        
        if nav_item.children is not None:
            for child in nav_item.children:
                self.add_navitem_to_spine(spine_el, child)
        

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
        