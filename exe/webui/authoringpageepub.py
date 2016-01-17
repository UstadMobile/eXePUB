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
        
     
    def render_GET(self, request=None):
        if request is not None:
            args = request.args
            a = 42
            
            
        html =  "<html><body></body></html>".encode('utf8')
        return html
    
        