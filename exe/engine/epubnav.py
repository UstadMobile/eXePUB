'''
Created on Jan 1, 2016

@author: mike
'''
from lxml import etree
import os.path
from exe.engine.path    import Path

class EPUBNavItem(object):
    
    PREFIX_EPUB = "http://www.idpf.org/2007/ops"
    
    DEFAULT_PAGENAME = "page"
    
    #TODO: Make children and all node properties dynamically generated by looking to the xml
    def __init__(self, opf, epub_item = None, li_item = None, ol_element = None):
        """
        Creates a new EPUBNavItem that represents an li item in the ol of the epub navigation
        XHTML document.
        """
        self.opf = opf
        self.li_item = None
        self._epub_item = None
        self._ol_element = ol_element
        
        if epub_item:
            self._epub_item = epub_item
        elif li_item:
            self.li_item = li_item
        
    
    
    @property
    def epub_item(self):
        if self._epub_item:
            return self._epub_item
        
        my_href = self.href 
        self._epub_item = self.opf.get_item_by_href(my_href)
        return self._epub_item
    
    def find_node(self, node_id):
        if self.id == node_id:
            return self
        
        if self.children:
            for child in self.children:
                result = child.find_node(node_id)
                if result:
                    return result
        
        return None
    
    def _get_child_by_tagname(self, el, tagname):
        """etree workaround for misbehaving {*} 
        """
        taglen = len(tagname) + 1
        tagmatch = "}%s" % tagname
        for child in el:
            if child.tag[-taglen:] == tagmatch:
                return child
                
        return None
    
    @property
    def ol_element(self):
        if self._ol_element is not None:
            return self._ol_element
        
        if self.li_item is not None:
            ol = self._get_child_by_tagname(self.li_item, "ol")
            if ol is not None:
                self._ol_element = ol
                return ol
            
        return None
    
    @property
    def title(self):
        """According to the EPUB Navigation document spec: the li_item
        must contain either a single a element or a single span element:
        the text content of which is the title
        """
        if self.li_item is not None:
            title_el = self._get_child_by_tagname(self.li_item, "a")
            if title_el is not None:
                return title_el.text
            title_el = self._get_child_by_tagname(self.li_item, "span")
            if title_el is not None:
                return title_el.text
        
        '''
        'We must be the navigation element which isn't nessasarily itself
         in the table of contents
         '''
        return ""
    
    @property     
    def href(self):
        if self._epub_item:
            return self._epub_item.href 
        elif self.li_item is not None:
            a_el = self._get_child_by_tagname(self.li_item, "a")
            if a_el is not None:
                return a_el.get("href")
            
        return None
    
    @property
    def id(self):
        return self.epub_item.id

    @property
    def children(self):
        result = []
        if self.ol_element:
            for child in self.ol_element:
                #technically all children should be li
                if child.tag[-2:] == "li":
                    result.append(EPUBNavItem(self.opf, li_item = child))
                    
        return result

    def process_ol(self, ol_element):
        result = []
        # get a list of all child el
        for child in ol_element:
            #technically all children should be li
            if child.tag[-2:] == "li":
                result.append(EPUBNavItem(self.opf, li_item = child))
                
        return result
    
    def createChild(self, template_path = None, title = "New Page"):
        new_html_filename = self.opf.find_free_filename(EPUBNavItem.DEFAULT_PAGENAME, ".xhtml")
        new_html_path = os.path.join(os.path.dirname(self.opf.href), new_html_filename)
        if template_path is None:
            from exe import globals as G
            template_path= G.application.config.webDir/"templates"/"blank.xhtml"
        
        Path(template_path).copyfile(new_html_path)
        self.opf.add_item_to_manifest(self.opf.get_id_for_href(new_html_filename), 
                                      "application/xhtml+xml", new_html_filename, ['scripted'])
        namespace = self.li_item.nsmap.get(None)
        if self.ol_element is None:
            etree.SubElement(self.li_item, "{%s}ol" % namespace)
        
        new_li_item = etree.SubElement(self.ol_element, "{%s}li" % namespace)
        a_el = etree.SubElement(new_li_item, "{%s}a" % namespace, href = new_html_filename)
        a_el.text = title
                
        return EPUBNavItem(self.opf, li_item = new_li_item)
        
    

class EPUBNavDocument(EPUBNavItem):
    '''
    classdocs
    '''


    def __init__(self, opf, epub_item, navdoc_src = None):
        '''
        Constructor
        '''
        #According to the epub spec; the child of the nav element must be a single ol list
        self.navdoc_el = etree.fromstring(navdoc_src)
        nav_els = self.navdoc_el.xpath(".//*[local-name() = 'nav']")
        for nav in nav_els:
            nav_type = nav.get("{%s}type" % EPUBNavItem.PREFIX_EPUB)
            if nav_type == "toc":
                self.toc_el = nav
                break
        
        if not hasattr(self, "toc_el"):
            raise ValueError("Epub navigation doc has no nav epub:type=toc")
            
        ol_el = self.toc_el.xpath("./*[local-name() = 'ol']")[0]
        EPUBNavItem.__init__(self, opf, epub_item = epub_item, ol_element=ol_el)
        
        
        
        
        
     
    

    
        