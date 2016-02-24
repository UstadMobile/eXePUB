'''
Created on Jan 8, 2016

@author: mike
'''
from lxml import etree
import os.path
import os
import shutil

from exe                         import globals as G
from exe.engine.htmlToText import HtmlToText
from exe.engine.path import Path, toUnicode

import logging
log = logging.getLogger(__name__)



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
    
    PREFIX_USER_FILES = "exe-files/user-added"
    
    """ 
    Elements that cannot use xml style closures  
    e.g. <script ... /> erronously makes most browsers think that 
    everything until </script> is a script...
    """
    TEXT_REQUIRED_ELEMENTS = ["script", "style"]

    def __init__(self, package, opf):
        '''
        Constructor
        '''
        self.package = package
        self.opf = opf
        
        self._xml_file_path = os.path.join(os.path.dirname(self.opf.href), "exeresources.xml")
        
        if os.path.exists(self._xml_file_path):
            self.root_el = etree.parse(self._xml_file_path).getroot()
            self.update_idevice_files()
            
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
        
        next_id = max_id + 1
        
        idevices_el = self.root_el.find("./{%s}idevices" % EPUBResourceManager.NS_EXERES)
        next_id_attr = idevices_el.get("nextid")
        
        if next_id_attr is not None:
            next_id_attr = int(next_id_attr)
            if next_id_attr < next_id:
                idevices_el.set('nextid', str(max_id+1))
            
            if next_id_attr > next_id:
                next_id = next_id_attr
        
        
        idevices_el.set("nextid", str(next_id + 1))
        
        return next_id
    
    def add_idevice_to_page(self, idevice_type, page_id, auto_save = True):        
        idevice_info = self.get_idevice_el(idevice_type)
        
        if idevice_info is None:
            """That's an invalid idevice type"""
            return None
        
        idevice_dir = idevice_info[0]
        idevice_el = idevice_info[1]
        
        
        pg_idevice_id = self.get_next_idevice_id()
        
        required_files = self.get_idevice_required_files(idevice_el)
        self.add_required_files_to_package(required_files)
        
        idevice_css_class = idevice_el.find(".//{%s}cssclass" % EPUBResourceManager.NS_IDEVICE).text
        self.update_page(page_id, new_idevice_id = pg_idevice_id, 
                         new_idevice_cssclass="Idevice %s" % idevice_css_class,
                         new_idevice_type = idevice_type)
        
                
        if auto_save:
            self.save()
        
        return pg_idevice_id
    
    def handle_idevice_deleted(self, page_id, idevice_id):
        #TODO: Handle user added resources that are linked to this idevice
        self.update_page(page_id)
        
                                      
    def update_idevice_files(self):
        """
        Update the files stores in exe-files that are associated with 
        idevices with those that come from eXe's own directories.
        """
        idevices_dir = os.path.join(os.path.dirname(self._xml_file_path), "exe-files/idevices")
        idevices_list = []
        if os.path.exists(idevices_dir):
            for idevice_dir in os.listdir(idevices_dir):
                idevice_path = os.path.join(idevice_dir, idevices_dir)
                if os.path.isdir(idevice_path):
                    idevices_list.append(idevice_dir)
        
        required_files = []
        for idevice_id in idevices_list:
            idevice_info = self.get_idevice_el(idevice_id)
            if idevice_info is not None:
                #make sure that we have this idevice on our system...
                required_files = self.get_idevice_required_files(idevice_info[1], 
                                                     required_files = required_files)
        
        self.add_required_files_to_package(required_files)
    
    def add_required_files_to_package(self, required_files):
        for file in required_files:
            src_path = None
                        
            if file[:len(EPUBResourceManager.PREFIX_COMMON_FILES)] == EPUBResourceManager.PREFIX_COMMON_FILES:
                rel_path = file[len(EPUBResourceManager.PREFIX_COMMON_FILES)+1:]
                src_path = os.path.join(G.application.config.webDir, "templates", rel_path)
            elif file[:len(EPUBResourceManager.PREFIX_IDEVICE_FILES)] == EPUBResourceManager.PREFIX_IDEVICE_FILES:
                idevice_trimmed = file[len(EPUBResourceManager.PREFIX_IDEVICE_FILES)+1:]
                sep_index = idevice_trimmed.index('/')
                idevice_type = idevice_trimmed[:sep_index]
                rel_path = idevice_trimmed[sep_index+1:]
                src_path = os.path.join(self.find_idevice_dir(idevice_type), rel_path)
                
            self.opf.add_file(src_path, file, auto_update = True)

    def add_user_file_to_idevice(self, idevice_id, user_file_path, new_basename = None):
        """
        Adds a file that was put in place by the user (e.g. user
        uploaded image etc.  We keep it linked with the idevice
        so we know if the idevice gets deleted what files might need
        deleted.
        """
        if new_basename is None:
            new_basename = os.path.basename(user_file_path) 
        
        path_in_pkg = "%s/%s" % (EPUBResourceManager.PREFIX_USER_FILES, new_basename)
        added_entry = self.opf.add_file(user_file_path, path_in_pkg)
        self.link_user_file_to_idevice(added_entry[0], idevice_id)
        return added_entry
            
    def link_user_file_to_idevice(self, file_manifest_id, idevice_id, auto_save = True):
        """
        Makes an entry in exeresources.xml under
        user-resources/itemref[idref=file_manifest_id]/ideviceref[idref=idevice_id]
        
        Thus marking the given resource from the manifest as a requirement of
        that particular idevice.
        """
        ns = EPUBResourceManager.NS_EXERES
        user_resources_el = self.root_el.find("./{%s}user-resources" % ns)
        itemref_el = user_resources_el.find("./{%s}itemref[@idref=\"%s\"]" % (ns, file_manifest_id))
        if itemref_el is None:
            itemref_el = etree.SubElement(user_resources_el, "{%s}itemref" % ns, idref = idevice_id)
        
        idevice_ref_el = itemref_el.find("./{%s}ideviceref[@idref=\"%s\"]" % (ns, idevice_id))
        if idevice_ref_el is None:
            etree.SubElement(itemref_el, "{%s}ideviceref" % ns, idref = idevice_id)
        
        if auto_save:
            self.save()
        
    
    def _append_required_files_from_resources_el(self, resources_el, prefix, res_types, required_files = []):
        for res_type in res_types:
            res_type_files = resources_el.findall("./{%s}%s" % (EPUBResourceManager.NS_IDEVICE, res_type))
            if res_type_files is not None:
                for res_file in res_type_files:
                    filename = "%s/%s" % (prefix, res_file.text)
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
    
    def update_all_pages(self):
        all_page_list = []
        self.opf.get_navigation().get_all_children(all_page_list)
        for page in all_page_list:
            self.update_page(page.id)
        print "Updated all pages"
    
    def update_page(self, page_id, new_idevice_id = None, new_idevice_cssclass = None, new_idevice_type = None):
        """Regenerate script and link elements as they are required for the idevices on the page"""
        page_path = self._get_page_path(page_id)
        
        #According to the epub spec: contents MUST be XHTML not just HTML
        page_html_el = etree.parse(page_path).getroot()
        ns_xhtml = page_html_el.nsmap.get(None)
        
        #check and see if we need to add the div dom element for the new idevice
        if new_idevice_id is not None:
            from exe.engine.epubpackage import EPUBPackage
            idevice_container_el = EPUBPackage.get_idevice_container_el(page_html_el)
            idevice_div_el = etree.SubElement(idevice_container_el, "{%s}div" % ns_xhtml)
            idevice_div_el.set("id", "id%s" % new_idevice_id)
            idevice_div_el.set("class", new_idevice_cssclass)
            idevice_div_el.set("data-idevice-type", new_idevice_type)
            idevice_div_el.text = " "
        
        
        page_idevice_els = page_html_el.findall(".//{%s}*[@data-idevice-type]" % ns_xhtml)
        
        required_css = []
        required_js = []
        for idevice in page_idevice_els:
            idevice_type = idevice.get("data-idevice-type")
            idevice_def_el = self.get_idevice_el(idevice_type)[1]
            
            self.get_idevice_required_files(idevice_def_el, res_types=["css"], required_files = required_css)
            self.get_idevice_required_files(idevice_def_el, res_types=["script"], required_files = required_js)
        
        
        #now build the resource list, remove any existing generated script and  link elements, add ones we need
        
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
            
        
        EPUBResourceManager.clean_html_el(page_html_el)    
        updated_src = etree.tostring(page_html_el, encoding="UTF-8", pretty_print = True)
        
        page_fd = open(page_path, "w")
        page_fd.write(updated_src)
        page_fd.flush()
        page_fd.close()
                
    @classmethod
    def clean_html_el(cls, html_el):
        """
        Filter out weirdness: mainly when the XML formatter makes
        <script/> and <style/> tags that confuse all browsers unless
        content-type is set to application/xhtml+xml (which doesn't 
        always happen)
        """
        ns = html_el.nsmap.get(None)
        for el_name in EPUBResourceManager.TEXT_REQUIRED_ELEMENTS:
            for element in html_el.findall(".//{%s}%s" % (ns, el_name)):
                if element.text is None:
                    element.text = " "
        
        return html_el
    
    def save(self):
        fd = open(self._xml_file_path, "w")
        fd.write(etree.tostring(self.root_el, encoding = "UTF-8", pretty_print = True))
        fd.flush()
        fd.close()    
        
        
        
    def process_previewed_images(self, content, page_id, idevice_id):
        """
        to build up the corresponding resources from any images (etc.) added
        in by the tinyMCE image-browser plug-in,
        which will have put them into src="../previews/"

        Now updated to include special math images as well, as generated
        by our custom exemath plugin to TinyMCE.  These are to follow the
        naming convention of "eXe_LaTeX_math_#.gif" (where the # is only
        guaranteed to be unique per Preview session, and can therefore end
        up being resource-ified into "eXe_LaTeX_math_#.#.gif"). Furthermore,
        they are to be paired with a source LateX file which is to be of
        the same name, followed by .tex, e.g., "eXe_LaTeX_math_#.gif.tex"
        (and to maintain this pairing, as a resource will need to be named
        "eXe_LaTeX_math_#.#.gif.tex" if applicable, where this does differ
        slightly from what could be its automatic unique-ified 
        resource-ification of: "eXe_LaTeX_math_#.gif.#.tex"!!!)
        """
        new_content = content

        # first, clear out any empty images.
        # Image and the new Math are unfortunately capable
        # of submitting an empty image, which will show as:
        #   <img src="/" />
        # (note that at least the media plugin still embeds a full 
        #  and valid empty-media tag, so no worries about them.)
        # These should be stopped in the plugin itself, but until then:
        empty_image_str = "<img src=\"/\" />"
        if new_content.find(empty_image_str) >= 0: 
            new_content = new_content.replace(empty_image_str, "");
            log.warn("Empty image tag(s) removed from content");


        # By this point, tinyMCE's javascript file browser handler:
        #         common.js's: chooseImage_viaTinyMCE() 
        # has already copied the file into the web-server's relative 
        # directory "/previews", BUT, something in tinyMCE's handler 
        # switches "/previews" to "../previews", so beware.....
        # 
        # At least it does NOT quote anything, and shows it as, for example: 
        #   <img src="../previews/%Users%r3m0w%Pictures%Remos_MiscPix% \
        #        SampleImage.JPG" height="161" width="215" /> 
        # old quoting-handling is still included in the following parsing,
        # which HAD allowed users to manually enter src= "file://..." URLs, 
        # but with the image now copied into previews, such URLS are no more.

        # DESIGN NOTE: eventually the following processing should be
        # enhanced to look at the HTML tags passed in, and ensure that
        # what is being found as 'src="../previews/.."' is really within
        # an IMG tag, etc.
        # For now, though, this easy parsing is working well:
        # JR        search_str = "src=\"../previews/" 
        search_str = "src=\"/previews/"
        # BEWARE OF THE ABOVE in regards to ProcessPreviewedMedia(),
        # which takes advantage of the fact that the embedded media
        # actually gets stored as src="previews/".
        # If this little weirdness of Images being stored as src="../previews/"
        # even changes to src="previews/", so more processing will be needed!

        found_pos = new_content.find(search_str) 
        while found_pos >= 0: 
            end_pos = new_content.find('\"', found_pos + len(search_str)) 
            if end_pos == -1: 
                # now unlikely that this has already been quoted out, 
                # since the search_str INCLUDES a \", but check anyway:
                end_pos = new_content.find('&quot', found_pos + 1) 
            else: 
                # okay, the end position \" was found, BUT beware of this 
                # strange case, where the image file:/// URLs 
                # were entered manually in one part of it 
                # (and therefore escaped to &quot), AND another quote occurs 
                # further below (perhaps even in a non-quoted file:/// via 
                # a tinyMCE browser, but really from anything!) 
                # So..... see if a &quot; is found in the file-name, and 
                # if so, back the end_pos up to there.  
                # NOTE: until actually looking at the HTML tags, and/or
                # we might be able to do this more programmatically by 
                # first seeing HOW the file:// is initially quoted, 
                # whether by a \" or by &quot;, but for now, 
                # just check this one.
                end_pos2 = new_content.find('&quot', found_pos + 1) 
                if end_pos2 > 0 and end_pos2 < end_pos:
                    end_pos = end_pos2
            if end_pos >= found_pos:
                # next, extract the actual file url, to be replaced later 
                # by the local resource file:
                file_url_str = new_content[found_pos:end_pos] 
                # and to get the actual file path, 
                # rather than the complete URL:

                # first compensate for how TinyMCE HTML-escapes accents:
                pre_input_file_name_str = file_url_str[len(search_str):]
                log.debug("ProcessPreviewedImages: found escaped file = " \
                           + pre_input_file_name_str)
                converter = HtmlToText(pre_input_file_name_str)
                input_file_name_str = converter.convertToText()

                log.debug("ProcessPreviewedImages: unescaped filename = " \
                           + input_file_name_str)

                webDir = Path(G.application.tempWebDir)
                previewDir = webDir.joinpath('previews')
                server_filename = previewDir.joinpath(input_file_name_str);

                # and now, extract just the filename string back out of that:
                file_name_str = server_filename.abspath().encode('utf-8');

                # Be sure to check that this file even exists before even 
                # attempting to create a corresponding GalleryImage resource:
                if os.path.exists(file_name_str) \
                and os.path.isfile(file_name_str): 
                    # Although full filenames (including flatted representations
                    # of their source directory tree) were used to help keep the
                    # filenames here in previewDir unique, this does cause
                    # problems with the filenames being too long, if they
                    # are kept that way.
                    # So.... if an optional .exe_info file is coupled to
                    # this one, go ahead and read in its original basename,
                    # in order to rename the file back to something shorter.
                    # After all, the resource process has its own uniqueifier.

                    # test for the optional .exe_info:
                    basename_value = os.path.basename(file_name_str)
                    descrip_file_path = Path(server_filename + ".exe_info")
                    if os.path.exists(descrip_file_path) \
                    and os.path.isfile(descrip_file_path): 
                        descrip_file = open(descrip_file_path, 'rb')
                        basename_info = descrip_file.read().decode('utf-8')
                        log.debug("ProcessPreviewedImages: decoded basename = " \
                            + basename_info)
                        # split out the value of this "basename=file" key 
                        basename_key_str = "basename="
                        basename_found_pos = basename_info.find(basename_key_str) 
                        # should be right there at the very beginning:
                        if basename_found_pos == 0: 
                            basename_value = \
                                   basename_info[len(basename_key_str):]
                    
                    #now we add the file to the package...
                    new_entry = self.add_user_file_to_idevice(idevice_id, file_name_str, 
                                                              new_basename = basename_value)
                    new_content = new_content.replace(file_url_str, "src=\"%s" % new_entry[1])
                    
            found_pos = new_content.find(search_str, found_pos + 1) 
    
        return new_content
