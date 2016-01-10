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

Ext.define('eXe.controller.Idevice', {
    extend: 'Ext.app.Controller',

    stores: ['IdeviceXmlStore'],
    
    init: function() {
        this.control({
            '#idevice_panel': {
                itemclick:	this.onIdeviceClick
            }
        });
    },
    
    onIdeviceClick: function(view, record, item, index, e, eOpts) {
        var authoring = Ext.ComponentQuery.query('#authoring')[0].getWin();
        if (authoring && authoring.submitLink && !view.panel.editing) {
            var outlineTreePanel = eXe.app.getController("Outline").getOutlineTreePanel(),
                selected = outlineTreePanel.getSelectionModel().getSelection();
            authoring.submitLink("AddIdevice", record.data.id, 1, selected !== 0? selected[0].data.id : '0');
        }else if(authoring && eXe.app.config.packageType == "EPUBPackage") {
        	var outlineTreePanel = eXe.app.getController("Outline").getOutlineTreePanel(),
            	selected = outlineTreePanel.getSelectionModel().getSelection();
        	Ext.Ajax.request({
        		url: location.pathname + "/idevicePane?action=AddIdeviceJS&page_id=" + 
        			selected[0].data.id + "idevice_id=" + record.id,
    			scope: this,
    			success: function(response) {
    				var jsonResp = Ext.JSON.decode(response.responseText);
    				var newIdeviceId = jsonResp['idevice_id'];
    				alert("Add new idevice: " + newIdeviceId);
    			}
        	})
        }
    },
    
    reload: function() {
        var store = this.getIdeviceXmlStoreStore();
        store.load();
    }
});