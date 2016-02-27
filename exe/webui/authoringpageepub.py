'''
Created on Jan 16, 2016

@author: mike
'''

import os
import logging
from exe.webui.renderable    import RenderableResource
from exe                     import globals as G
from twisted.web.resource    import Resource


log = logging.getLogger(__name__)


class AuthoringPageEPUB(RenderableResource):
    '''
    AuthoringPageEPUB handles AJAX calls from idevice javascript
    and manages saving and manipulating the HTML of the page
    '''

    name = u'authoring'

    def __init__(self, parent):
        RenderableResource.__init__(self, parent)
        '''
        Constructor
        '''
    
    def render_POST(self, request=None):
        response = {}
        if "action" in request.args:
            if request.args['action'][0] == "saveidevicehtml":
                page_id = request.args['page_id'][0]
                self.package.main_opf.set_page_idevice_html(page_id,
                        request.args['idevice_id'][0], request.args['html'][0])
            elif request.args['action'][0] == "saveidevicetincan":
                self.package.tincan_manager.set_activities_by_idevice(
                        request.args['page_id'][0], request.args['idevice_id'][0], 
                        request.args['tincan_xml'][0])
            
                                                                      
     
    def render_GET(self, request=None):
        if "action" in request.args:
            if request.args['action'][0] == "deleteidevice":
                page_id = request.args['page_id'][0]
                idevice_id = request.args['idevice_id'][0]
                self.package.main_opf.delete_idevice_from_page(page_id, idevice_id)
                self.package.main_opf.resource_manager.handle_idevice_deleted(page_id, idevice_id)
            elif request.args['action'][0] == "moveidevice":
                self.package.main_opf.resource_manager.move_idevice_in_page(
                        request.args['page_id'][0], request.args['idevice_id'][0],
                        int(request.args['increment'][0]))
                
        html =  "<html><body></body></html>".encode('utf8')
        return html
    
        