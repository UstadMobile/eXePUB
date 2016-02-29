// ===========================================================================
// eXe
// This file: Copyright 2014, Mike Dawson, UstadMobile Inc
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

/*
 * This helper script configures an iframe that looks like a mobile 
 * device to show content within.
 * 
 * See previewpage.html for arguments that can be passed
 */

var $eXePreview = {
		
	vMargin: 30,
	
	padTop: 0,
	
	padBottom: 0,
	
    /**
     * Turns search query variables into a dictionary - adapted from
     * http://css-tricks.com/snippets/javascript/get-url-variables/
     * 
     * @param {string} queryStr Input query string
     * @method getQueryVariable
     */
    getQueryVariables : function(queryStr) {
        var locationQuery = window.location.search.substring.length >= 1 ?
            window.location.search.substring(1) : "";
        var query = (typeof queryStr !== "undefined") ? queryStr : 
            locationQuery;
        
        var retVal = {};
        if(window.location.search.length > 2) {
            var vars = query.split("&");
            for (var i=0;i<vars.length;i++) {
                var pair = vars[i].split("=");
                retVal[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
            }
        }
        return retVal;
    },

	init: function() {
		var queryVars = $eXePreview.getQueryVariables();
		$("#mobviewiframe").attr("src", queryVars['src']);
		if(queryVars['width']) {
			$("#mobviewiframe").width(queryVars['width']);
		}
				
		if(queryVars['pad-top']) {
			this.padTop = parseInt(queryVars['pad-top']);
			$("#mobviewcell").css("padding-top", queryVars['pad-top']+ "px");
			
		}
		
		if(queryVars['pad-bottom']) {
			this.padBottom = parseInt(queryVars['pad-bottom']);
			$("#mobviewcell").css("padding-bottom", queryVars['pad-bottom']+ "px");
		}
		
		this.updateHeight();
	},
    
    updateHeight: function() {
    	var winHeight = $(window).height();
    	var vPadding = (this.padTop + this.padBottom);
    	$("frametable").height((winHeight - $eXePreview.vMargin - vPadding) + "px");
    	$("#mobviewiframe").height((winHeight - $eXePreview.vMargin - 32 - vPadding) + "px");
    }
}


