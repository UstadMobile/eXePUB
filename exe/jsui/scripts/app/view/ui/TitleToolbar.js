// ===========================================================================
// eXe
// Copyright 2014 Ustad Mobile, Varuna Singh
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

Ext.define('eXe.view.ui.TitleToolbar', {
    extend: 'Ext.toolbar.Toolbar',
    alias: 'widget.titletoolbar',

    initComponent: function() {
        var me = this;
        var projectTitle =  _('Untitled Project');
        
        Ext.applyIf(me, {
            items: [
                {
                	xtype: 'button',
                	itemId: 'tools_wizard',
                	icon: '/images/eXe_icon.ico',
                	text: '',
                	tooltip: _('Click me to open the wizard'),
                	scale: 'large'
                },
				{
				    xtype: 'button',
				    text: projectTitle,
				    itemId: 'title_button',
				    id: 'title_button',
				    scale: "large"
				},
				{
					xtype: 'tbfill',
				}
		          			
            ]
        });

        me.callParent(arguments);
    }
});	