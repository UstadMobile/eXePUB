// ===========================================================================
// eXe
// Copyright 2012, Pedro Peña Pérez, Open Phoenix IT
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
//===========================================================================

Ext.define('eXe.controller.Outline', {
    extend: 'Ext.app.Controller',

    stores: ['OutlineXmlTreeStore'],
    
    refs: [{
	    	selector: '#outline_treepanel',
	    	ref: 'outlineTreePanel'
    	}, {
    		selector: '#outline_add_node',
    		ref: 'outlineAddNodeBtn'
    	}, {
    		selector: '#outline_del_node',
    		ref: 'outlineDelNodeBtn'
    	}, {
    		selector: '#outline_ren_node',
    		ref: 'outlineRenNodeBtn'
    	}, {
    		selector: 'outlinetoolbar1',
    		ref: 'outlineToolBar1'
    	}
    ],
    
    init: function() {
        this.control({
        	'#outline_treepanel': {
        		itemclick:	this.onNodeClick,
                itemdblclick: this.onNodeRename,
                itemcontextmenu: this.onNodeContextMenu
        	},
        	'#outline_add_node': {
        		click: this.onNodeAdd
        	},
        	'#outline_del_node': {
        		click: this.onNodeDel
        	},
        	'#outline_ren_node': {
        		click: this.onNodeRename
        	},
            '#outline_promote_node': {
                click: { fn: this.processNodeEvent, action: 'PromoteNode' }
            },
            '#outline_demote_node': {
                click: { fn: this.processNodeEvent, action: 'DemoteNode' }
            },
            '#outline_up_node': {
                click: { fn: this.processNodeEvent, action: 'UpNode' }
            },
            '#outline_down_node': {
                click: { fn: this.processNodeEvent, action: 'DownNode' }
            },
            '#authoring': {
            	load: {
            		fn : this.processAuthoringPageLoad
            	}
            }
        });
        
        var keymap = new Ext.util.KeyMap(Ext.getBody(), [
             
	        {
               	 key: Ext.event.Event.INSERT,
		    	 handler: function() {
		    		 this.onNodeAdd();
		    	 },
		         ctrl: true,
		    	 scope: this,
		    	 defaultEventAction: "stopEvent"
		     },
		     {
		    	 key: Ext.event.Event.DELETE,
		    	 handler: function() {
		    		 this.onNodeDel();
		    	 },
		         ctrl: true,
		    	 scope: this,
		    	 defaultEventAction: "stopEvent"
		     },
		     {
		    	 key: Ext.event.Event.R,
                 ctrl: true,
		    	 handler: function() {
		    		 this.onNodeRename();
		    	 },
		    	 scope: this,
		    	 defaultEventAction: "stopEvent"
		     },
		     {
		    	 key: Ext.event.Event.UP,
                 ctrl: true,
		    	 handler: function() {
		    		 this.nodeAction('PromoteNode');
		    	 },
		    	 scope: this,
		    	 defaultEventAction: "stopEvent"
		     },
		     {
		    	 key: Ext.event.Event.DOWN,
                 ctrl: true,
		    	 handler: function() {
		    		 this.nodeAction('DemoteNode');
		    	 },
		    	 scope: this,
		    	 defaultEventAction: "stopEvent"
		     },
		     {
		    	 key: Ext.event.Event.U,
                 ctrl: true,
		    	 handler: function() {
		    		 this.nodeAction('UpNode');
		    	 },
		    	 scope: this,
		    	 defaultEventAction: "stopEvent"
		     },
		     {
		    	 key: Ext.event.Event.D,
                 ctrl: true,
		    	 handler: function() {
		    		 this.nodeAction('DownNode');
		    	 },
		    	 scope: this,
		    	 defaultEventAction: "stopEvent"
		     }
        ]);        
    },

    onNodeContextMenu: function(view, record, item, index, e, eOpts) {
        e.preventDefault();
        this.onNodeClick(view, record, item, index, e, eOpts);
        var contextMenu = new Ext.menu.Menu({
		  items: [
            {
            	xtype: 'menucheckitem',
			    text: _('Linear'),
			    checked: record.data.linear,
			    handler:  function(item, evt) {
			    	record.data.linear = item.checked;
			    	this.nodeAction(item.checked ? "LinearNode" : "NonLinearNode", false);
			    },
			    scope: this
		    }
          ]
		});
        var x = e.browserEvent.clientX;
        var y = e.browserEvent.clientY;
        contextMenu.showAt([x, y]);
    },
    
    processNodeEvent: function(menu, item, e, eOpts) {
        this.nodeAction(e.action)
    },
    
    /**
     * Handle action being applied to a node
     * 
     * @param {String} action the Action to send to the server using nevow_clientToServerEvent
     * @param {boolean} disableButtons=true Disable the add page, delete and rename buttons whilst 
     * event is ongoing - a server to client call is responsible to re-enable them. 
     */
    nodeAction: function(action, disableButtons) {
        var outlineTreePanel = this.getOutlineTreePanel(),
            selected = outlineTreePanel.getSelectionModel().getSelection(),
            nodeid = '0';
        
        if (selected != 0)
            nodeid = selected[0].data.id;
        
        if(typeof disableButtons === "undefined" || disableButtons === true) {
        	this.disableButtons();
        }
        
        nevow_clientToServerEvent(action, this, '', nodeid);
    },
    
    onLaunch: function() {
    	this.reload();
    },
    
    onNodeClick: function(view, record, item, index, e, eOpts) {
    	this.loadNodeOnAuthoringPage(record.data.id);
        document.title = "eXe : " + record.data.text;
    },
    
    onNodeAdd: function(button, e, eOpts) {
    	var outlineTreePanel = this.getOutlineTreePanel(),
    		selected = outlineTreePanel.getSelectionModel().getSelection(),
    		nodeid = '0';
    	
    	if (selected != 0)
    		nodeid = selected[0].data.id;
    	this.disableButtons();
		nevow_clientToServerEvent('AddChild', this, '', nodeid);    		
    },
    
    onNodeDel: function(button, e, eOpts) {
    	var outlineTreePanel = this.getOutlineTreePanel(),
    		selected = outlineTreePanel.getSelectionModel().getSelection(),
    		nodeid = '0', msg;
    	
    	if (selected != 0)
    		nodeid = selected[0].data.id;
    	if (nodeid != '0') { 
    		msg = new Ext.Template(_('Delete "{node}" node and all its children?')).apply({node: selected[0].data.text});
    		Ext.Msg.show( {
    			title: _('Confirm'),
    			msg: msg,
    			scope: this,
    			modal: true,
    			buttons: Ext.Msg.YESNO,
    			fn: function(button) {
					if (button == "yes")	{
						this.disableButtons();
						nevow_clientToServerEvent('DelNode', this, '', nodeid);
			    	}
    			}
    		});
    	}
	},

    onNodeRename: function() {
    	var outlineTreePanel = this.getOutlineTreePanel(),
    		selected = outlineTreePanel.getSelectionModel().getSelection(),
    		nodeid = '0', title;
    	
    	if (selected != 0)
    		nodeid = selected[0].data.id;
		title = new Ext.Template(_('Rename "{node}" node')).apply({node: selected[0].data.text});
		Ext.Msg.show({
			prompt: true,
			title: title,
			msg: _('Enter the new name:'),
			buttons: Ext.Msg.OKCANCEL,
			multiline: false,
			value: selected[0].data.text,
			scope: this,
			fn: function(button, text) {
				if (button == "ok")	{
					if (text) {
						this.disableButtons();
						nevow_clientToServerEvent('RenNode', this, '', nodeid, text);
					}
		    	}
			}
		});
    },

    loadNodeOnAuthoringPage: function(nodeid) {
        var authoring = Ext.ComponentQuery.query('#authoring')[0].getWin();
        if (authoring && authoring.submitLink) {
    		authoring.submitLink('changeNode', nodeid, 0);
    	}else {
    		var store = this.getOutlineXmlTreeStoreStore();
    		var node = store.getNodeById(nodeid);
    		if(node && node.data.epubhref) {
    			var authoringHREF = document.location.href + "/authoring";
    			var epubPageHREF = document.location.href + "/resources/" + node.data.epubhref;
    			var authoringHREF = epubPageHREF + "?exe-authoring-mode=true&exe-page-id=" + 
    				encodeURIComponent(node.id) + "&exe-authoring-save-to=" +
    				encodeURIComponent(authoringHREF) + "&exe-authoring-page-nav-title=" +
    				encodeURIComponent(node.data.text) + "&clientHandleId=" +
    				encodeURIComponent(nevow_clientHandleId);
    				
    			Ext.ComponentQuery.query('#authoring')[0].getDoc().location.href = authoringHREF;
    			
    			this.getController('MainTab').setFramePreviewURL(epubPageHREF);
    		}else if(!node && store.isLoading()) {
    			//this is a node just added; wait for the store to load
    			setTimeout((function() {
    				this.loadNodeOnAuthoringPage(nodeid);
    			}).bind(this), 500);
    		}
        }
    },
    
    processAuthoringPageLoad: function(evt) {
    	if(eXe.app.isEPUBFormat()) {
    		var authoringDoc = Ext.ComponentQuery.query('#authoring')[0].getDoc();
    		var scriptEl = authoringDoc.createElement("script");
    		scriptEl.setAttribute("src", "/scripts/epub_authoring.js");
    		scriptEl.setAttribute("type", "text/javascript");
    		authoringDoc.getElementsByTagName("head")[0].appendChild(scriptEl);
    	}
    },
    
    //called from exe.jsui.outlinepane.OutlinePane.handleSetTreeSelection
    select: function(nodeid) {
    	var outlineTreePanel = this.getOutlineTreePanel(),
    		selmodel = outlineTreePanel.getSelectionModel(),
    		store = this.getOutlineXmlTreeStoreStore(), node;
    		
        outlineTreePanel.expandAll();
    	node = store.getNodeById(nodeid);
    	if (node) {
    		selmodel.select(node);
            document.title = "eXe : " + node.data.text;
    	}
    	this.enableButtons();
    },
    
    enableButtons: function() {
    	this.getOutlineAddNodeBtn().enable();
    	this.getOutlineDelNodeBtn().enable();
    	this.getOutlineRenNodeBtn().enable();
    },
    
    disableButtons: function() {
    	this.getOutlineAddNodeBtn().disable();
    	this.getOutlineDelNodeBtn().disable();
    	this.getOutlineRenNodeBtn().disable();
    },

    reload: function() {
    	var store = this.getOutlineXmlTreeStoreStore();
    	store.load();
    }
});