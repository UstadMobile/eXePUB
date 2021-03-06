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
        self.package = package
        self.xml_path = os.path.join(package.resourceDir, "tincan.xml")
        self.xml_doc = None
        ns = TinCanXMLManager.NS_TINCAN
        if os.path.isfile(self.xml_path):
            self.xml_doc = etree.parse(self.xml_path).getroot()
        else:
            self.xml_doc = etree.Element("{%s}tincan" % ns, nsmap = {None: ns})
            etree.SubElement(self.xml_doc, "{%s}activities" % ns)
            
        self.update_launch_el()
    
    def _get_base_id(self):
        return "epub:%s" % self.package.main_opf.get_opf_id()
    
    def update_base_id(self):
        """Updates the base id according to the OPF"""
    
    def _get_launch_activity(self, auto_save = True):
        """Returns the current activity with a launch element or generates it if not present yet"""
        ns = TinCanXMLManager.NS_TINCAN
        launch_el = self.xml_doc.find(".//{%s}launch" % ns)
        launch_activity = None
        
        if launch_el is not None:
            launch_activity = launch_el.getparent()
        else:
            activities_el = self.xml_doc.find(".//{%s}activities" % ns)
            launch_activity = etree.SubElement(activities_el, "{%s}activity" % ns)
            launch_activity.set("id", self._get_base_id())
            launch_activity.set("type", "http://adlnet.gov/expapi/activities/course")
            name_el = etree.SubElement(launch_activity, "{%s}name" % ns)
            name_el.text = self.package.main_opf.get_title()
            launch_el = etree.SubElement(launch_activity, "{%s}launch" % ns)
            launch_el.set("lang", "en-us")
        
            #TODO: Change this to reference the first linear item from the spine
            launch_el.text = "index.html"
            if auto_save: 
                self.save()
            
        return launch_activity
    
    def set_base_id(self, new_base_id, auto_save = True):
        """Change the base ID of this package"""
        current_base_id= self._get_launch_activity().get('id')
        ns = TinCanXMLManager.NS_TINCAN
        activity_id = None
        
        for activity_el in self.xml_doc.findall(".//{%s}activity" % ns):
            activity_id = activity_el.get("id")
            if activity_id[0:len(current_base_id)] == current_base_id:
                activity_id = new_base_id + activity_id[len(current_base_id):]
                activity_el.set("id", activity_id)
        
        if auto_save:
            self.save()
        
    def update_launch_el(self, auto_save = True):
        #check to see if we have a launch item - if not - set it
        ns = TinCanXMLManager.NS_TINCAN
        launch_activity = self._get_launch_activity()
        
        if auto_save:
            self.save()
            
    
    def delete_activities_by_idevice(self, idevice_id):
        """Deletes all activity elements for the given page and idevice id"""
        current_activities = self.get_activities_by_idevice(idevice_id)
        for activity_el in current_activities:
            activity_el.getparent().remove(activity_el)
    
    def set_activities_by_idevice(self, page_id, idevice_id, activities_str, auto_save = True):
        ns = TinCanXMLManager.NS_TINCAN
        ext_key = TinCanXMLManager.EXT_KEY_IDEVICE
         
        #remove those currently set for this activity
        self.delete_activities_by_idevice(idevice_id)
        
        activities_el = etree.fromstring(activities_str)
        doc_activities = self.xml_doc.find("./{%s}activities" % ns)
        
        
        id_prefix = self._get_base_id()
        for activity_el in activities_el:
            activity_el.set("id", "%s/%s/%s" % (id_prefix, page_id, activity_el.get("id")))
            
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
        
        