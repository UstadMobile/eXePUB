'''
Created on Jan 16, 2016

@author: mike
'''

import os
import os.path
import logging
from exe.webui.renderable    import RenderableResource
from exe                     import globals as G
from twisted.web.resource    import Resource
import json

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
            
    def _get_client_by_id(self, request = None, client_handle_id = None):
        if client_handle_id is None:
            client_handle_id = request.args['clientHandleId'][0]
        
        active_client = None
        for client in self.parent.clientHandleFactory.clientHandles.values():
            if client_handle_id == client.handleId:
                active_client = client
                break
            
        return active_client
                
                                                                      
     
    def render_GET(self, request=None):
        return_value = {}
        request.setHeader('content-type', 'application/xml')
        
        if "action" in request.args:
            if request.args['action'][0] == "deleteidevice":
                page_id = request.args['page_id'][0]
                idevice_id = request.args['idevice_id'][0]
                self.package.main_opf.delete_idevice_from_page(page_id, idevice_id)
                self.package.main_opf.resource_manager.handle_idevice_deleted(page_id, idevice_id)
                self.package.tincan_manager.delete_activities_by_idevice(idevice_id)
                return_value = {'status': 'ok'}
            elif request.args['action'][0] == "moveidevice":
                self.package.main_opf.resource_manager.move_idevice_in_page(
                        request.args['page_id'][0], request.args['idevice_id'][0],
                        int(request.args['increment'][0]))
                return_value = {'status': 'ok'}
            elif request.args['action'][0] == "requestfile":
                request_opts = request.args['opts'][0]
                active_client = self._get_client_by_id(request = request)
                if active_client:
                    active_client.call('eXe.app.getController("MainTab").showRequestUserFile',
                       request_opts)
                    return_value = {'status': 'ok'}
                else:
                    log.warn("Requested to add file: no active client with that client handle id: %s" % request['clientHandleId'][0])
                    return_value = {'status': 'fail : invalid client handle id'}
                       
            elif request.args['action'][0] == "addfile":
                #TODO : Check this comes from the main application NOT a malicious idevice
                src_path = request.args['path'][0]
                idevice_id = request.args['idevice_id'][0]
                added_entry = self.package.main_opf.resource_manager.add_user_file_to_idevice(idevice_id, src_path)
                return_value = {
                    'status': 'ok',
                    'entry' : {
                       'id' : added_entry[0],
                       'href' : added_entry[1]
                    }
                }
                
        return json.dumps(return_value)
    
        