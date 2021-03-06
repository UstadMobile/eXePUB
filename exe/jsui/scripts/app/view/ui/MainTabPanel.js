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

Ext.define('eXe.view.ui.MainTabPanel', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.maintabpanel',
    requires: [
        'eXe.view.forms.DublinCoreDataPanel',
        'eXe.view.forms.LomDataPanel',
        'eXe.view.forms.ExportPanel',
        'eXe.view.forms.PackagePanel',
        'Ext.ux.IFrame'
    ],
    activeTab: 0,

    initComponent: function() {
        var me = this;

        Ext.applyIf(me, {
            itemId: 'main_tab',
            items: [
                {
                	xtype: 'uxiframe',
                    itemId: 'authoring',
                    src: eXe.app.config.authoringIFrameSrc,
                    id: 'authoringIFrame1',
                    title: _('Authoring'),
                    margin: "0 4",
                    padding: "0 2"
                },
                {
                	xtype: 'panel',
                	itemId: 'preview_panel',
                	title: _('Preview'),
                	layout: 'vbox',
                	items: [
                	        {
								xtype: "toolbar",
								itemId: "preview_type_toolbar",
								width: "100%",
								//vertical: true,
								defaults: {
									xtype: "button",
									scale: "large",
									enableToggle: true
								},
								items: [{
									icon: "/images/fa-desktop.png",
									itemId: "preview_show_desktop",
									pressed: true
								},
								{
									icon: "/images/fa-mobile.png",
									itemId: "preview_show_mobile"				
								},
								{
									xtype:"tbfill",
									itemId: "preview_tab_fill"
								}
								]
							},
            	        	{
                            	xtype: 'uxiframe',
                                itemId: 'authoring_preview',
                                src: eXe.app.config.authoringIFrameSrc,
                                id: 'authoringPreviewIFrame1',
                                margin: "0 4",
                                padding: "0 2",
                                flex: 1,
                                width: "100%"
                            }
                   ]
                },
                {
                    xtype: 'tabpanel',
                    title: _('Properties'),
                    itemId: 'properties_tab',
                    activeTab: 0,
                    items: [
                        {
                            xtype: 'package',
                            itemId: 'package_properties',
                            title: _('Package')
                        },
                        {
                            xtype: 'tabpanel',
                            title: _('Metadata'),
                            itemId: 'metadata_tab',
                            items: [
	                            {
		                            xtype: 'dublincoredata',
                                    itemId: 'dublincoredata_properties',
	                                title: _('Dublin Core')
	                            },
                                {
                                    xtype: 'lomdata',
                                    prefix: 'lom_',
                                    itemId: 'lomdata_properties',
                                    title: _('LOM')
                                },
                                {
                                    xtype: 'lomdata',
                                    prefix: 'lomes_',
                                    itemId: 'lomesdata_properties',
                                    title: _('LOM-ES')
                                }
                            ]
                        },
                        {
                            xtype: 'export',
                            itemId: 'export_properties',
                            title: _('Export')
                        }
                    ]
                }
            ]
        });

        me.callParent(arguments);
    }
});
