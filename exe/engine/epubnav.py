'''
Created on Jan 1, 2016

@author: mike
'''
import xml.dom.minidom


class EPUBNavItem(object):
    
    def __init__(self, opf, epub_item = None, li_item = None):
        self.opf = opf
        self.title = "EPUBNavItem"
        self.children = []
        self.title = ""
        
        if epub_item:
            self.epub_item = epub_item
        elif li_item:
            self.process_li(li_item)
        
    
    def process_li(self, li_element):
        for child in li_element.childNodes:
            #according to the spec there must be either a child a element or span element
            if child.nodeName.lower() == "a":
                href = child.attributes["href"].value
                self.epub_item = self.opf.get_item_by_href(href)
                self.title = child.firstChild.nodeValue
        
        #todo: add self.children = process_ol if an ol children is present
        for child in li_element.childNodes:
            if child.nodeName.lower() == "ol":
                pass #something like self.children = process_ol...
    
    def find_node(self, node_id):
        if self.id == node_id:
            return self
        
        if self.children:
            for child in self.children:
                result = child.find_node(node_id)
                if result:
                    return result
        
        return None
    
    @property     
    def href(self):
        return self.epub_item.href 
    
    @property
    def id(self):
        return self.epub_item.id

    def process_ol(self, ol_element):
        result = []
        # get a list of all child el
        for child in ol_element.childNodes:
            #technically all children should be li
            if child.nodeName.lower() == "li":
                result.append(EPUBNavItem(self.opf, li_item = child))
                
        return result
    

class EPUBNavDocument(EPUBNavItem):
    '''
    classdocs
    '''


    def __init__(self, opf, epub_item, navdoc_src = None):
        '''
        Constructor
        '''
        EPUBNavItem.__init__(self, opf, epub_item = epub_item)
        
        if navdoc_src is not None:
            self.parseXML(navdoc_src)
        
    
    
    def parseXML(self, navdoc_src):
        xml_doc = xml.dom.minidom.parseString(navdoc_src)
        nav_els = xml_doc.getElementsByTagName("nav")
        for current_nav in nav_els:
            nav_type = current_nav.attributes["epub:type"].value
            if nav_type == "toc":
                ol_el = current_nav.getElementsByTagName("ol")[0]
                self.children = self.process_ol(ol_el)
        


    
        