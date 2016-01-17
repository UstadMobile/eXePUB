'''
Created on Jan 8, 2016

@author: mike
'''
from lxml import etree
import os.path
import os

from exe                         import globals as G

class EPUBResourceManager(object):
    '''
    classdocs
    '''

    NS_EXERES = "http://www.ustadmobile.com/ns/exe-resources"
    
    NS_IDEVICE = "http://www.ustadmobile.com/ns/exelearning-idevice"
    
    
    """The prefix used for files that get added that are shared between different idevices"""
    PREFIX_COMMON_FILES = "exe-files/common"
    
    """File prefix used for files that are specific to a given type of idevice"""
    PREFIX_IDEVICE_FILES = "exe-files/idevices"

    def __init__(self, package, opf):
        '''
        Constructor
        '''
        self.package = package
        self.opf = opf
        
        self._xml_file_path = os.path.join(os.path.dirname(self.opf.href), "exeresources.xml")
        
        if os.path.exists(self._xml_file_path):
            self.root_el = etree.parse(self._xml_file_path).getroot()
        else:
            ns = EPUBResourceManager.NS_EXERES
            self.root_el = etree.Element("{%s}exe-resources" % ns, nsmap = {None: ns})
            etree.SubElement(self.root_el, "{%s}idevices" % ns)
            etree.SubElement(self.root_el, "{%s}user-resources" % ns)
            
    
    def get_next_idevice_id(self):
        """Find the next usable idevice id
        """
        idevice_ids = self.root_el.xpath("er:idevices/er:itemref/er:idevice/@id",
                                 namespaces={"er" : EPUBResourceManager.NS_EXERES})
        max_id = 0
        for id in idevice_ids:
            if int(id) > max_id:
                max_id = int(id)
        
        return max_id + 1
        
    def _get_page_itemref_el(self, page_id, auto_create = True):
        itemref_el = self.root_el.find("./{%(ns)s}idevices/{%(ns)s}itemref[@idref='%(id)s']" % \
                                       {"ns" : EPUBResourceManager.NS_EXERES, "id" : page_id})
        if itemref_el is None and auto_create:
            itemref_el = etree.SubElement(self.root_el.find("./{%s}idevices" % \
                            EPUBResourceManager.NS_EXERES), "{%s}itemref" % EPUBResourceManager.NS_EXERES)
            itemref_el.set("idref", page_id)
            
        return itemref_el
    
    def add_idevice_to_page(self, idevice_type, page_id, auto_save = True):
        page_el = self._get_page_itemref_el(page_id)
        
        idevice_info = self.get_idevice_el(idevice_type)
        
        if idevice_info is None:
            """That's an invalid idevice type"""
            return None
        
        idevice_dir = idevice_info[0]
        idevice_el = idevice_info[1]
        
        
        pg_idevice_id = self.get_next_idevice_id()
        pg_idevice_el = etree.SubElement(page_el, "{%s}idevice" % EPUBResourceManager.NS_EXERES)
        pg_idevice_el.set("id", str(pg_idevice_id))
        pg_idevice_el.set("type", idevice_type) 
        
        required_files = self.get_idevice_required_files(idevice_el)
        self.add_required_files_to_package(required_files)
        
        idevice_css_class = idevice_el.find(".//{%s}cssclass" % EPUBResourceManager.NS_IDEVICE).text
        self.update_page(page_id, new_idevice_id = pg_idevice_id, 
                         new_idevice_cssclass="Idevice %s" % idevice_css_class)
        
        
        
        if auto_save:
            self.save()
        
        return pg_idevice_id
    
    def add_required_files_to_package(self, required_files):
        for file in required_files:
            src_path = None
            
            if not self.opf.contains_href(file):
                if file[:len(EPUBResourceManager.PREFIX_COMMON_FILES)] == EPUBResourceManager.PREFIX_COMMON_FILES:
                    rel_path = file[len(EPUBResourceManager.PREFIX_COMMON_FILES)+1:]
                    src_path = G.application.config.webDir/"templates"/rel_path
                elif file[:len(EPUBResourceManager.PREFIX_IDEVICE_FILES)] == EPUBResourceManager.PREFIX_IDEVICE_FILES:
                    idevice_trimmed = file[len(EPUBResourceManager.PREFIX_IDEVICE_FILES)+1:]
                    sep_index = idevice_trimmed.index("/")
                    idevice_type = idevice_trimmed[:sep_index]
                    rel_path = idevice_trimmed[sep_index+1:]
                    src_path = self.find_idevice_dir(idevice_type)/rel_path
                    
                self.opf.add_file(src_path, file)
            
            
    
    def _append_required_files_from_resources_el(self, resources_el, prefix, res_types, required_files = []):
        for res_type in res_types:
            res_type_files = resources_el.findall("./{%s}%s" % (EPUBResourceManager.NS_IDEVICE, res_type))
            if res_type_files is not None:
                for res_file in res_type_files:
                    filename = os.path.join(prefix, res_file.text)
                    if filename not in required_files:
                        required_files.append(filename)
                    
        return required_files
    
    def get_idevice_required_files(self, idevice_el, res_types = ["css", "script", "res"], required_files = []):
        """Return a list of the files required for this idevice: optionally filtered by file type"""
        
        system_resources_el = idevice_el.find("./{%s}system-resources" % EPUBResourceManager.NS_IDEVICE)
        if system_resources_el is not None:
            self._append_required_files_from_resources_el(system_resources_el, EPUBResourceManager.PREFIX_COMMON_FILES, 
                           res_types, required_files)
        
        idevice_resources_el = idevice_el.find("./{%s}idevice-resources" % EPUBResourceManager.NS_IDEVICE)
        if idevice_resources_el is not None:
            idevice_id = idevice_el.find("./{%s}id" % EPUBResourceManager.NS_IDEVICE).text
            self._append_required_files_from_resources_el(idevice_resources_el, 
                           "%s/%s" % (EPUBResourceManager.PREFIX_IDEVICE_FILES, idevice_id), 
                           res_types, required_files)
        
        return required_files
        
    
    def find_idevice_dir(self, idevice_type, user_idevice_dir = None, common_idevice_dir = None):
        """Return where the given idevice is located if it's in the user_idevice_dir or common_idevice_dir, or none if not found"""
        idevice_dir = None
        
        if user_idevice_dir is None:
            user_idevice_dir = G.application.config.configDir/"idevices"
            
        if common_idevice_dir is None:
            common_idevice_dir= G.application.config.webDir/"templates"/"idevices"
        
        if os.path.exists(user_idevice_dir) and os.path.isfile(user_idevice_dir/idevice_type/"idevice.xml"):
            idevice_dir = user_idevice_dir/idevice_type
        elif os.path.exists(common_idevice_dir) and os.path.isfile(common_idevice_dir/idevice_type/"idevice.xml"):
            idevice_dir = common_idevice_dir/idevice_type
        
        return idevice_dir
        
        
    
    def get_idevice_el(self, idevice_type):
        """Returns a tuple with the directory which contains the idevice and it's etree element parsed"""
        
        idevice_dir = self.find_idevice_dir(idevice_type)
            
        root_el = etree.parse(idevice_dir/"idevice.xml").getroot()
        return (idevice_dir, root_el)
    
    
    def _get_page_path(self, page_id):
        """Returns the file system path to the given page id"""
        opf_item = self.opf.get_item_by_id(page_id)
        page_path = os.path.join(os.path.dirname(self.opf.href), opf_item.href)
        return page_path
    
    def update_page(self, page_id, new_idevice_id = None, new_idevice_cssclass = None):
        """Regenerate script and link elements as they are required for the idevices on the page"""
        page_path = self._get_page_path(page_id)
        
        #According to the epub spec: contents MUST be XHTML not just HTML
        page_html_el = etree.parse(page_path).getroot()
        
        #find idevices in this page
        page_resources_el = self.root_el.find(".//{%s}itemref[@idref='%s']" % (EPUBResourceManager.NS_EXERES, page_id))
        
        #TODO: Ha
        page_idevice_els = page_resources_el.findall("./{%s}idevice" % EPUBResourceManager.NS_EXERES)
        
        required_css = []
        required_js = []
        for idevice in page_idevice_els:
            idevice_type = idevice.get("type")
            idevice_def_el = self.get_idevice_el(idevice_type)[1]
            
            self.get_idevice_required_files(idevice_def_el, res_types=["css"], required_files = required_css)
            self.get_idevice_required_files(idevice_def_el, res_types=["script"], required_files = required_js)
        
        
        #now build the resource list, remove any existing generated script and  link elements, add ones we need
        ns_xhtml = page_html_el.nsmap.get(None)
        page_head_el = page_html_el.find("./{%s}head" % ns_xhtml)
        for auto_item in page_head_el.findall(".//{%s}*[@data-exeres='true']" % ns_xhtml):
            auto_item.getparent().remove(auto_item)
        
        for css_file in required_css:
            link_el = etree.SubElement(page_head_el, "{%s}link" % ns_xhtml)
            link_el.set("rel", "stylesheet")
            link_el.set("type", "text/css")
            link_el.set("href", css_file)
            link_el.set("data-exeres", "true")
        
        for js_script in required_js:
            script_el = etree.SubElement(page_head_el, "{%s}script" % ns_xhtml)
            script_el.set("src", js_script)
            script_el.set("type", "text/javascript")
            script_el.set("data-exeres", "true")
            script_el.text = "\n"
            
        
        #check and see if we need to add the div dom element for the new idevice
        if new_idevice_id is not None:
            from exe.engine.epubpackage import EPUBPackage
            idevice_container_el = EPUBPackage.get_idevice_container_el(page_html_el)
            idevice_div_el = etree.SubElement(idevice_container_el, "{%s}div" % ns_xhtml)
            idevice_div_el.set("id", "id%s" % new_idevice_id)
            idevice_div_el.set("class", new_idevice_cssclass)
            idevice_div_el.text = " "
            
        updated_src = etree.tostring(page_html_el, encoding="UTF-8", pretty_print = True)
        
        page_fd = open(page_path, "w")
        page_fd.write(updated_src)
        page_fd.flush()
        page_fd.close()
                
    
    def save(self):
        fd = open(self._xml_file_path, "w")
        fd.write(etree.tostring(self.root_el, encoding = "UTF-8", pretty_print = True))
        fd.flush()
        fd.close()    
        