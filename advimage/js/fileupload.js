var FileUploadDialog = {

    refreshFn : null,

	init : function(ed) {
        this.refreshFn = tinyMCEPopup.getWindowArg("refreshFn");

		tinyMCEPopup.resizeToInnerSize();
    },
    
	doUpload : function( ) {
		var ed = tinyMCEPopup.editor, t = this, f = window.document.forms[0];

		if (f.name.value.length > 0) {	    
		   var filename = f.name.value;
		   if( isImage( filename ) ) {
		     f.submit();		    
		   } else {
		     alert("Invalid image file type. Must be a JPEG, PNG, or GIF.");
		   }
		}
  },
  
  fileUploadDone : function(responseIframe) {
	
	if( responseIframe.contentDocument.URL == "about:blank" ) {
	  return;
	} else {
  
  		// TODO: Check response of form
	    //       set status variable.
			
    	var document = responseIframe.contentDocument.firstChild.outerHTML;	
	    
	    var xmlDoc = null;
	    if (window.DOMParser) {
          parser=new DOMParser();
          xmlDoc=parser.parseFromString(document,"text/xml");
        } else { 
          // Internet Explorer
          xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
          xmlDoc.async=false;
          xmlDoc.loadXML(document);
        } 
	
		var successNode = xmlDoc.getElementsByTagName("success");
		if( successNode.length > 0 ) {
		  this.refreshFn("success");
		} else {	
		  var responseMsg = "Error uploading file.";
		  var failedNode = xmlDoc.getElementsByTagName("failed");
		  if( failedNode.length > 0 ) {
            responseMsg = failedNode[0].nodeValue
          }
          this.refreshFn( responseMsg );
        }
	
	    tinyMCEPopup.close();
		return;
    }
  }
  
};

function getExtension(filename) {
    var parts = filename.split('.');
    return parts[parts.length - 1];
}

function isImage(filename) {
    var ext = getExtension(filename);
    switch (ext.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'png':
        //etc
        return true;
    }
    return false;
}

tinyMCEPopup.onInit.add(FileUploadDialog.init, FileUploadDialog);
