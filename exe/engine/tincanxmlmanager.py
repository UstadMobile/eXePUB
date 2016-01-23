'''

Designed to manage tincan.xml for a file saved in an EPUB

@author: mike
'''
import os.path
from lxml import etree

class TinCanXMLManager(object):
    '''
    classdocs
    '''
    
    NS_TINCAN = "http://projecttincan.com/tincan.xsd"
    
    EXT_KEY_IDEVICE = "http://ustadmobile.com/ns/tincan-ext-idevice"
    
    def __init__(self, package):
        '''
        Constructor
        '''
        self.xml_path = os.path.join(package.resourceDir, "tincan.xml")
        self.xml_doc = None
        ns = TinCanXMLManager.NS_TINCAN
        if os.path.isfile(self.xml_path):
            self.xml_doc = etree.parse(self.xml_path).getroot()
        else:
            self.xml_doc = etree.Element("{%s}tincan" % ns, nsmap = {None: ns})
            etree.SubElement(self.xml_doc, "{%s}activities" % ns)
        
    
    def set_activities_by_idevice(self, idevice_id, activities_str, auto_save = True):
        ns = TinCanXMLManager.NS_TINCAN
        ext_key = TinCanXMLManager.EXT_KEY_IDEVICE
         
        #remove those currently set for this activity
        current_activities = self.get_activities_by_idevice(idevice_id)
        for activity_el in current_activities:
            activity_el.getparent().remove(activity_el)
        
        activities_el = etree.fromstring(activities_str)
        doc_activities = self.xml_doc.find("./{%s}activities" % ns)
        
        for activity_el in activities_el:
            extensions_el = activity_el.find("./{%s}extensions" % ns)
            if extensions_el is None:
                extensions_el = etree.SubElement(activity_el, "{%s}extensions" % ns)
            
            extension_el = extensions_el.find("./{%s}extension[@key='%s']" % (ns, ext_key))
            if not extension_el:
                extension_el = etree.SubElement(extensions_el, "{%s}extension" % ns)
                extension_el.set('key', ext_key)
            
            extension_el.text = idevice_id
                
            doc_activities.append(activity_el)
        
        if auto_save:
            self.save()
    
    def get_activities_by_idevice(self, idevice_id):
        idevice_activities = []
        ns = TinCanXMLManager.NS_TINCAN
        ext_key = TinCanXMLManager.EXT_KEY_IDEVICE
        
        activities = self.xml_doc.findall(".//{%s}activity" % ns)
        
        for activity_el in self.xml_doc.findall(".//{%s}activity" % ns):
            idevice_el = activity_el.find(".//{%s}extension[@key='%s']" % (ns, ext_key))
            if idevice_el is not None:
                if idevice_el.text == idevice_id:
                    idevice_activities.append(activity_el)
            
        return idevice_activities
        
    
    def save(self):
        fd = open(self.xml_path, "w")
        fd.write(etree.tostring(self.xml_doc, encoding = "UTF-8", pretty_print = True))
        fd.flush()
        fd.close()
        
        