'''
Created on Jan 1, 2016

@author: mike
'''
from lxml import etree
import os.path
from exe.engine.path    import Path
from exe.engine.epubpackage import EPUBPackage

class EPUBNavItem(object):
    
    PREFIX_EPUB = "http://www.idpf.org/2007/ops"
    
    DEFAULT_PAGENAME = "page"
    
    #TODO: Make children and all node properties dynamically generated by looking to the xml
    def __init__(self, opf, element, epub_item = None, ol_element = None):
        """
        Creates a new EPUBNavItem that represents an li item in the ol of the epub navigation
        XHTML document.
        """
        self.opf = opf
        
        """The li element that is in the navigation document representing
        this navigation item: or in the case of root; the nav element
        """
        self.element = element
        self._epub_item = None
        self._ol_element = ol_element
        
        
        if epub_item is not None:
            self._epub_item = epub_item
    
    
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
    
    def __eq__(self, other):
        if isinstance(other, EPUBNavItem):
            return self.element == other.element
        else:
            return False
        
    def __ne__(self, other):
        return not self.__eq__(other)
    
    
    @property
    def parent(self):
        tag_name = self.element.tag
        if len(tag_name) >= 3 and tag_name[-3] == "nav":
            """This is the root of the navigation - the nav element"""
            return None
        else:
            """self.element is the li, need parent's parent e.g. -ol-li/nav el"""
            parent_el = self.element.getparent().getparent()
            if parent_el.tag[-2:] == "li":
                return EPUBNavItem(self.opf, parent_el)
            elif parent_el.tag[-3:] == "nav":
                return self.opf.get_navigation()
    
    def next_sibling(self):
        if self.element.getnext() is not None:
            return EPUBNavItem(self.opf, self.element.getnext())
        
        return None
    
    def previous_sibling(self):
        if self.element.getprevious() is not None:
            return EPUBNavItem(self.opf, self.element.getprevious()) 
        
        return None
    
    def ancestors(self):
        """Iterates over our ancestors"""
        if self.parent is not None: # All top level nodes have no ancestors
            node = self
            while node is not None and node != self.opf.get_navigation():
                if not hasattr(node, 'parent'):
                    #log.warn("ancestor node has no parent")
                    node = None
                else: 
                    node = node.parent
                    yield node
                    
    def isAncestorOf(self, node):
        """If we are an ancestor of 'node' returns 'true'"""
        return self in node.ancestors()   
    
    def delete(self, auto_save = True):
        #TODO: Delete children recursively to ensure those files are removed 
        my_href = self.href
        self.parent.ol_element.remove(self.element)
        
        #see if there are any remaining references in this toc to same href...
        nav_el = self.opf.get_navigation().element
        ns_default = nav_el.nsmap.get(None) 
        if nav_el.find("{%s}a[@href='%s']" % (ns_default, my_href)) is None:
            #nothing points here anymore - should be removed
            self.opf.delete_item_by_href(my_href)
        
        self.opf.update_spine()
        self.opf.set_package_changed()
            
        if auto_save:
            #save the navigation document as it will be now
            self.opf.get_navigation().save()
    
    def move_vertical(self, increment, auto_save = True):
        ol_parent = self.element.getparent()
        current_pos = ol_parent.index(self.element)
        new_pos = current_pos + increment
        if new_pos >= 0 and new_pos < len(ol_parent):
            ol_parent.remove(self.element)
            ol_parent.insert(new_pos, self.element)
            
            if auto_save:
                self.opf.get_navigation().save()
            self.opf.set_package_changed()
            return True
        
        return False
    
    def up(self, auto_save = True):
        return self.move_vertical(-1, auto_save)
    
    def down(self, auto_save = True):
        return self.move_vertical(1, auto_save)
    
    @property
    def index(self):
        """Returns the index of this navitem at it's level (e.g. pos of li tag within ol tag)"""
        return self.element.getparent().index(self.element)
    
    def promote(self, auto_save = True):
        """Move this node up one level in the hierachy if possible"""
        if self.parent is not None and self.parent.parent is not None:
            current_ol_parent = self.element.getparent()
            new_ol_parent = self.parent.element.getparent()
            new_index = self.parent.index + 1
            current_ol_parent.remove(self.element)
            new_ol_parent.insert(new_index, self.element)
            self.opf.set_package_changed()
            
            if auto_save:
                self.opf.get_navigation().save()
                
            return True
            
        return False
    
    def demote(self, auto_save = True):
        previous_sibling = self.previous_sibling()
        if previous_sibling is not None:
            current_ol_parent = self.element.getparent()
            new_ol_parent = previous_sibling.ol_element
            if new_ol_parent is None:
                new_ol_parent = etree.SubElement(previous_sibling.element, 
                                                 "{%s}ol" % self.element.nsmap.get(None))
            current_ol_parent.remove(self.element)
            new_ol_parent.insert(0, self.element)
            self.opf.set_package_changed()
            
            if auto_save:
                self.opf.get_navigation().save()
            
    
    @property
    def ol_element(self):
        """ol_element contained within the li tag for this item: e.g. 
        the ol_element that would contain child nodes
        """
        if self._ol_element is not None:
            return self._ol_element
        
        if self.element is not None:
            ol = self._get_child_by_tagname(self.element, "ol")
            if ol is not None:
                self._ol_element = ol
                return ol
            
        return None
    
    def _get_title_el(self):
        """There must be EITHER an a element or a span element (not  both)
        """
        title_el = self._get_child_by_tagname(self.element, "a")
        if title_el is not None:
            return title_el
        title_el = self._get_child_by_tagname(self.element, "span")
        return title_el
         
    
    def get_title(self):
        """According to the EPUB Navigation document spec: the li_item
        must contain either a single a element or a single span element:
        the text content of which is the title
        """
        title_el = self._get_title_el()
        if title_el is not None:
            return title_el.text
        
        '''
        'We must be the navigation element which isn't nessasarily itself
         in the table of contents
         '''
        return ""
    
    def set_title(self, title, auto_save = True):
        """Set the title : Find the right element and set the text
        """
        title_el = self._get_title_el()
        old_title = title_el.text
        if title == old_title:
            #no change
            return
        
        title_el.text = title
        
        if self.href is not None:
            old_href = self.href
            new_filename = self.opf.find_free_filename(EPUBPackage.sanitize_for_filename(title), ".xhtml")
            dirname = os.path.dirname(self.opf.href)
            current_path = os.path.join(dirname, self.href)
            new_path = os.path.join(dirname, new_filename)
            if new_path != current_path:
                os.rename(current_path, new_path)
                #now set the href link properly
                self.opf.handle_item_renamed(old_href, new_filename)
                title_el.set("href", new_filename)
        
        self.opf.set_package_changed()
        if auto_save:
            self.opf.get_navigation().save()
    
            
    
    def RenamedNodePath(self):
        """Here for compatibility with node.py - does nothing"""
        pass
    
    title = property(get_title, set_title)
    
    @property     
    def href(self):
        if self._epub_item:
            return self._epub_item.href 
        elif self.element is not None:
            a_el = self._get_child_by_tagname(self.element, "a")
            if a_el is not None:
                return a_el.get("href")
            
        return None
    
    @property
    def id(self):
        return self.epub_item.id

    @property
    def children(self):
        result = []
        if self.ol_element is not None:
            for child in self.ol_element:
                #technically all children should be li
                if child.tag[-2:] == "li":
                    result.append(EPUBNavItem(self.opf, child))
                    
        return result
    
    def createChild(self, template_path = None, title = "New Page", auto_save = True):
        new_html_filename = self.opf.find_free_filename(EPUBNavItem.DEFAULT_PAGENAME, ".xhtml")
        new_html_path = os.path.join(os.path.dirname(self.opf.href), new_html_filename)
        if template_path is None:
            from exe import globals as G
            template_path= G.application.config.webDir/"templates"/"blank.xhtml"
        
        Path(template_path).copyfile(new_html_path)
        self.opf.add_item_to_manifest(self.opf.get_id_for_href(new_html_filename), 
                                      "application/xhtml+xml", new_html_filename, ['scripted'])
        namespace = self.element.nsmap.get(None)
        if self.ol_element is None:
            etree.SubElement(self.element, "{%s}ol" % namespace)
        
        new_li_item = etree.SubElement(self.ol_element, "{%s}li" % namespace)
        a_el = etree.SubElement(new_li_item, "{%s}a" % namespace, href = new_html_filename)
        a_el.text = title
        
        if auto_save:
            self.opf.get_navigation().save()
        
        self.opf.update_spine()
        self.opf.set_package_changed()
        
        return EPUBNavItem(self.opf, new_li_item)
    
    
            
    

class EPUBNavDocument(EPUBNavItem):
    '''
    classdocs
    '''


    def __init__(self, opf, epub_item, navdoc_src = None, file_path = None):
        '''
        Constructor
        '''
        self.file_path = file_path
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
        EPUBNavItem.__init__(self, opf, self.toc_el, epub_item = epub_item, ol_element=ol_el)
        
        
        
    def save(self):
        if self.file_path is not None:
            navdoc_file = open(self.file_path, "w")
            navdoc_file.write(etree.tostring(self.navdoc_el, encoding = "UTF-8", pretty_print = True))
            navdoc_file.flush()
            navdoc_file.close()
        
    
        
        
        