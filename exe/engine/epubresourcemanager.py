'''
Created on Jan 8, 2016

@author: mike
'''
from lxml import etree
import os.path
import os

class EPUBResourceManager(object):
    '''
    classdocs
    '''

    NS_EXERES = "http://www.ustadmobile.com/ns/exe-resources"
    

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
        idevice_id = self.get_next_idevice_id()
        idevice_el = etree.SubElement(page_el, "{%s}idevice" % EPUBResourceManager.NS_EXERES)
        idevice_el.set("id", str(idevice_id))
        idevice_el.set("type", idevice_type) 
        return idevice_id
    
    def save(self):
        fd = open(self._xml_file_path, "w")
        fd.write(etree.tostring(self.root_el, encoding = "UTF-8", pretty_print = True))
        fd.flush()
        fd.close()    
        