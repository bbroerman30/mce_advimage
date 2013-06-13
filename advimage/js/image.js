var ImageDialog = {
  preInit : function() {
    var url;

    tinyMCEPopup.requireLangPack();

    if (url = tinyMCEPopup.getParam("external_image_list_url"))
      document.write('<script language="javascript" type="text/javascript" src="' + tinyMCEPopup.editor.documentBaseURI.toAbsolute(url) + '"></script>');
  },

  init : function(ed) {
    var f = document.forms[0], nl = f.elements, ed = tinyMCEPopup.editor, dom = ed.dom, n = ed.selection.getNode();

    tinyMCEPopup.resizeToInnerSize();
    this.fillClassList('class_list');
    this.fillFileList('src_list', 'tinyMCEImageList');
    this.fillFileList('over_list', 'tinyMCEImageList');
    this.fillFileList('out_list', 'tinyMCEImageList');
    TinyMCE_EditableSelects.init();

    if (n.nodeName == 'IMG') {
      nl.src.value = dom.getAttrib(n, 'src');
      nl.width.value = dom.getAttrib(n, 'width');
      nl.height.value = dom.getAttrib(n, 'height');
      nl.alt.value = dom.getAttrib(n, 'alt');
      nl.title.value = dom.getAttrib(n, 'title');
      nl.vspace.value = this.getAttrib(n, 'vspace');
      nl.hspace.value = this.getAttrib(n, 'hspace');
      nl.border.value = this.getAttrib(n, 'border');
      selectByValue(f, 'align', this.getAttrib(n, 'align'));
      selectByValue(f, 'class_list', dom.getAttrib(n, 'class'), true, true);
      nl.style.value = dom.getAttrib(n, 'style');
      nl.id.value = dom.getAttrib(n, 'id');
      nl.dir.value = dom.getAttrib(n, 'dir');
      nl.lang.value = dom.getAttrib(n, 'lang');
      nl.usemap.value = dom.getAttrib(n, 'usemap');
      nl.longdesc.value = dom.getAttrib(n, 'longdesc');
      nl.insert.value = ed.getLang('update');

      if (/^\s*this.src\s*=\s*\'([^\']+)\';?\s*$/.test(dom.getAttrib(n, 'onmouseover')))
        nl.onmouseoversrc.value = dom.getAttrib(n, 'onmouseover').replace(/^\s*this.src\s*=\s*\'([^\']+)\';?\s*$/, '$1');

      if (/^\s*this.src\s*=\s*\'([^\']+)\';?\s*$/.test(dom.getAttrib(n, 'onmouseout')))
        nl.onmouseoutsrc.value = dom.getAttrib(n, 'onmouseout').replace(/^\s*this.src\s*=\s*\'([^\']+)\';?\s*$/, '$1');

      if (ed.settings.inline_styles) {
        // Move attribs to styles
        if (dom.getAttrib(n, 'align'))
          this.updateStyle('align');

        if (dom.getAttrib(n, 'hspace'))
          this.updateStyle('hspace');

        if (dom.getAttrib(n, 'border'))
          this.updateStyle('border');

        if (dom.getAttrib(n, 'vspace'))
          this.updateStyle('vspace');
      }
    }

    // Setup browse button
    document.getElementById('srcbrowsercontainer').innerHTML = getBrowserHTML('srcbrowser','src','image','theme_advanced_image');
    if (isVisible('srcbrowser'))
      document.getElementById('src').style.width = '260px';

    // Setup browse button
    document.getElementById('onmouseoversrccontainer').innerHTML = getBrowserHTML('overbrowser','onmouseoversrc','image','theme_advanced_image');
    if (isVisible('overbrowser'))
      document.getElementById('onmouseoversrc').style.width = '260px';

    // Setup browse button
    document.getElementById('onmouseoutsrccontainer').innerHTML = getBrowserHTML('outbrowser','onmouseoutsrc','image','theme_advanced_image');
    if (isVisible('outbrowser'))
      document.getElementById('onmouseoutsrc').style.width = '260px';

    // If option enabled default contrain proportions to checked
    if (ed.getParam("advimage_constrain_proportions", true))
      f.constrain.checked = true;

    // Check swap image if valid data
    if (nl.onmouseoversrc.value || nl.onmouseoutsrc.value)
      this.setSwapImage(true);
    else
      this.setSwapImage(false);

    this.changeAppearance();
    this.showPreviewImage(nl.src.value, 1);

    this.processResize();
    this.refresh();

    var that = this;
    this._setEventListener(document.getElementById('dirlist'), 'onmousedown', function(e){that._rightclick(e);});
    this._setEventListener(document.getElementById('treeview'),'onmousedown', function(e){that._rightclick(e);});
    document.oncontextmenu = function() {return false;};
  },

  insert : function(file, title) {
    var ed = tinyMCEPopup.editor, t = this, f = document.forms[0];

    if (f.src.value === '') {
      if (ed.selection.getNode().nodeName == 'IMG') {
        ed.dom.remove(ed.selection.getNode());
        ed.execCommand('mceRepaint');
      }

      tinyMCEPopup.close();
      return;
    }

    if (tinyMCEPopup.getParam("accessibility_warnings", 1)) {
      if (!f.alt.value) {
        tinyMCEPopup.editor.windowManager.confirm(tinyMCEPopup.getLang('advimage_dlg.missing_alt'), function(s) {
          if (s)
            t.insertAndClose();
        });

        return;
      }
    }

    t.insertAndClose();
  },

  insertAndClose : function() {
    var ed = tinyMCEPopup.editor, f = document.forms[0], nl = f.elements, v, args = {}, el;

    tinyMCEPopup.restoreSelection();

    // Fixes crash in Safari
    if (tinymce.isWebKit)
      ed.getWin().focus();

    if (!ed.settings.inline_styles) {
      args = {
        vspace : nl.vspace.value,
        hspace : nl.hspace.value,
        border : nl.border.value,
        align : getSelectValue(f, 'align')
      };
    } else {
      // Remove deprecated values
      args = {
        vspace : '',
        hspace : '',
        border : '',
        align : ''
      };
    }

    tinymce.extend(args, {
      src : nl.src.value,
      width : nl.width.value,
      height : nl.height.value,
      alt : nl.alt.value,
      title : nl.title.value,
      'class' : getSelectValue(f, 'class_list'),
      style : nl.style.value,
      id : nl.id.value,
      dir : nl.dir.value,
      lang : nl.lang.value,
      usemap : nl.usemap.value,
      longdesc : nl.longdesc.value
    });

    args.onmouseover = args.onmouseout = '';

    if (f.onmousemovecheck.checked) {
      if (nl.onmouseoversrc.value)
        args.onmouseover = "this.src='" + nl.onmouseoversrc.value + "';";

      if (nl.onmouseoutsrc.value)
        args.onmouseout = "this.src='" + nl.onmouseoutsrc.value + "';";
    }

    el = ed.selection.getNode();

    if (el && el.nodeName == 'IMG') {
      ed.dom.setAttribs(el, args);
    } else {
      ed.execCommand('mceInsertContent', false, '<img id="__mce_tmp" />', {skip_undo : 1});
      ed.dom.setAttribs('__mce_tmp', args);
      ed.dom.setAttrib('__mce_tmp', 'id', '');
      ed.undoManager.add();
    }

    tinyMCEPopup.close();
  },

  getAttrib : function(e, at) {
    var ed = tinyMCEPopup.editor, dom = ed.dom, v, v2;

    if (ed.settings.inline_styles) {
      switch (at) {
        case 'align':
          if (v = dom.getStyle(e, 'float'))
            return v;

          if (v = dom.getStyle(e, 'vertical-align'))
            return v;

          break;

        case 'hspace':
          v = dom.getStyle(e, 'margin-left')
          v2 = dom.getStyle(e, 'margin-right');

          if (v && v == v2)
            return parseInt(v.replace(/[^0-9]/g, ''));

          break;

        case 'vspace':
          v = dom.getStyle(e, 'margin-top')
          v2 = dom.getStyle(e, 'margin-bottom');
          if (v && v == v2)
            return parseInt(v.replace(/[^0-9]/g, ''));

          break;

        case 'border':
          v = 0;

          tinymce.each(['top', 'right', 'bottom', 'left'], function(sv) {
            sv = dom.getStyle(e, 'border-' + sv + '-width');

            // False or not the same as prev
            if (!sv || (sv != v && v !== 0)) {
              v = 0;
              return false;
            }

            if (sv)
              v = sv;
          });

          if (v)
            return parseInt(v.replace(/[^0-9]/g, ''));

          break;
      }
    }

    if (v = dom.getAttrib(e, at))
      return v;

    return '';
  },

  setSwapImage : function(st) {
    var f = document.forms[0];

    f.onmousemovecheck.checked = st;
    setBrowserDisabled('overbrowser', !st);
    setBrowserDisabled('outbrowser', !st);

    if (f.over_list)
      f.over_list.disabled = !st;

    if (f.out_list)
      f.out_list.disabled = !st;

    f.onmouseoversrc.disabled = !st;
    f.onmouseoutsrc.disabled  = !st;
  },

  fillClassList : function(id) {
    var dom = tinyMCEPopup.dom, lst = dom.get(id), v, cl;

    if (v = tinyMCEPopup.getParam('theme_advanced_styles')) {
      cl = [];

      tinymce.each(v.split(';'), function(v) {
        var p = v.split('=');

        cl.push({'title' : p[0], 'class' : p[1]});
      });
    } else
      cl = tinyMCEPopup.editor.dom.getClasses();

    if (cl.length > 0) {
      lst.options[lst.options.length] = new Option(tinyMCEPopup.getLang('not_set'), '');

      tinymce.each(cl, function(o) {
        lst.options[lst.options.length] = new Option(o.title || o['class'], o['class']);
      });
    } else
      dom.remove(dom.getParent(id, 'tr'));
  },

  fillFileList : function(id, l) {
    var dom = tinyMCEPopup.dom, lst = dom.get(id), v, cl;

    l = window[l];

    if (l && l.length > 0) {
      lst.options[lst.options.length] = new Option('', '');

      tinymce.each(l, function(o) {
        lst.options[lst.options.length] = new Option(o[0], o[1]);
      });
    } else
      dom.remove(dom.getParent(id, 'tr'));
  },

  resetImageData : function() {
    var f = document.forms[0];

    f.elements.width.value = f.elements.height.value = '';
  },

  updateImageData : function(img, st) {
    var f = document.forms[0];

    if (!st) {
      f.elements.width.value = img.width;
      f.elements.height.value = img.height;
    }

    this.preloadImg = img;
  },

  changeAppearance : function() {
    var ed = tinyMCEPopup.editor, f = document.forms[0], img = document.getElementById('alignSampleImg');

    if (img) {
      if (ed.getParam('inline_styles')) {
        ed.dom.setAttrib(img, 'style', f.style.value);
      } else {
        img.align = f.align.value;
        img.border = f.border.value;
        img.hspace = f.hspace.value;
        img.vspace = f.vspace.value;
      }
    }
  },

  changeHeight : function() {
    var f = document.forms[0], tp, t = this;

    if (!f.constrain.checked || !t.preloadImg) {
      return;
    }

    if (f.width.value == "" || f.height.value == "")
      return;

    tp = (parseInt(f.width.value) / parseInt(t.preloadImg.width)) * t.preloadImg.height;
    f.height.value = tp.toFixed(0);
  },

  changeWidth : function() {
    var f = document.forms[0], tp, t = this;

    if (!f.constrain.checked || !t.preloadImg) {
      return;
    }

    if (f.width.value == "" || f.height.value == "")
      return;

    tp = (parseInt(f.height.value) / parseInt(t.preloadImg.height)) * t.preloadImg.width;
    f.width.value = tp.toFixed(0);
  },

  updateStyle : function(ty) {
    var dom = tinyMCEPopup.dom, st, v, f = document.forms[0], img = dom.create('img', {style : dom.get('style').value});

    if (tinyMCEPopup.editor.settings.inline_styles) {
      // Handle align
      if (ty == 'align') {
        dom.setStyle(img, 'float', '');
        dom.setStyle(img, 'vertical-align', '');

        v = getSelectValue(f, 'align');
        if (v) {
          if (v == 'left' || v == 'right')
            dom.setStyle(img, 'float', v);
          else
            img.style.verticalAlign = v;
        }
      }

      // Handle border
      if (ty == 'border') {
        dom.setStyle(img, 'border', '');

        v = f.border.value;
        if (v || v == '0') {
          if (v == '0')
            img.style.border = '0';
          else
            img.style.border = v + 'px solid black';
        }
      }

      // Handle hspace
      if (ty == 'hspace') {
        dom.setStyle(img, 'marginLeft', '');
        dom.setStyle(img, 'marginRight', '');

        v = f.hspace.value;
        if (v) {
          img.style.marginLeft = v + 'px';
          img.style.marginRight = v + 'px';
        }
      }

      // Handle vspace
      if (ty == 'vspace') {
        dom.setStyle(img, 'marginTop', '');

        dom.setStyle(img, 'marginBottom', '');

        v = f.vspace.value;
        if (v) {
          img.style.marginTop = v + 'px';
          img.style.marginBottom = v + 'px';
        }
      }

      // Merge
      dom.get('style').value = dom.serializeStyle(dom.parseStyle(img.style.cssText));
    }
  },

  changeMouseMove : function() {
  },

  showPreviewImage : function(u, st) {
    if (!u) {
      tinyMCEPopup.dom.setHTML('prev', '');
      return;
    }

    if (!st && tinyMCEPopup.getParam("advimage_update_dimensions_onchange", true))
      this.resetImageData();

    u = tinyMCEPopup.editor.documentBaseURI.toAbsolute(u);

    if (!st)
      tinyMCEPopup.dom.setHTML('prev', '<img id="previewImg" src="' + u + '" border="0" onload="ImageDialog.updateImageData(this);" onerror="ImageDialog.resetImageData();" />');
    else
      tinyMCEPopup.dom.setHTML('prev', '<img id="previewImg" src="' + u + '" border="0" onload="ImageDialog.updateImageData(this, 1);" />');
  },

  lastHeight : null,
  
  processResize : function () 
  {
      var myHeight = 0;
      if( typeof( window.innerHeight ) == 'number' ) 
      {
          //Non-IE
          myHeight = window.innerHeight;
      } 
      else if( document.documentElement && ( document.documentElement.clientHeight ) ) 
      {
          //IE 6+ in 'standards compliant mode'
          myHeight = document.documentElement.clientHeight;
      } 
      else if( document.body && ( document.body.clientHeight ) ) 
      {
          //IE 4 compatible
          myHeight = document.body.clientHeight;
      }
      
      if( this.lastHeight == null )
          this.lastHeight = myHeight;
      
      var deltaSize = myHeight - this.lastHeight;
  
  try {
     // resize the browser window to be the proper height...
     document.getElementById('treeview').style.height = 
     ( this.getComputedStyle( document.getElementById('treeview'), "height") + deltaSize ) + "px";
     
     document.getElementById('dirlist').style.height =      
     ( this.getComputedStyle( document.getElementById('dirlist'), "height") + deltaSize ) + "px";
     
     document.getElementById('browser_panel').style.height =     
     ( this.getComputedStyle( document.getElementById('browser_panel'), "height") + deltaSize ) + "px";
   }
   catch( e )
   {
   }
     
     this.lastHeight = myHeight;
  },

  getComputedStyle : function (el,styleProp)
  {
      var y = null;
	
	  if( el == null )
	  {
	      return 0;
	  }
	
	  if ( el.currentStyle )
	  {
	      styleProp = styleProp.replace(/\-(\w)/g, function (strMatch, p1) {
			                                         return p1.toUpperCase(); });

	      y = el.currentStyle[styleProp];
      }
	  else if (window.getComputedStyle)
	  {
	      y = document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp);
      }
		
	  return parseInt(y);
   },
   
  _httpBaseImageDir : "",       // Base directory relative URL.
  _currDirectory : "/",         // Contains a the current directory path.
  _fileList : "",               // List of files to be uploaded.
  _currSecurityKey : "",        // Used to track the current security key expected by the browser server.
  _indexFirstShiftclick : null, // Index of the element clicked on with the shift key. 
  _objRightClicked : null,      // Pointer to the object the mouse was over when a right-click occurred.

  refresh : function () {
         var params = "action=listDirs";
         var that = this;

         this._sendAjaxRequest( params , function(responseXML) {

            that._populateDirTree(responseXML);

            //
            // TODO: Scroll to the current directory. expand it if it has children and is collapsed
            // This is most useful in a refresh situation (add a directory, or click refresh).
            //

            if( that._currDirectory != null )
            {
                that.selectDir(that._currDirectory)
            }
            else
            {
                that.selectDir("/");
            }
     } );

  },

  getFileList : function() {        
    if( document.ftpappl && document.ftpappl.isActive && document.ftpappl.isActive() && document.ftpappl.setPercentCallBack ) 
    {
      document.ftpappl.setPercentCallBack( "ImageDialog._setPercent" );
      document.ftpappl.setFilePercentCallBack( "ImageDialog._setFilePercent" );
      document.ftpappl.setStatusCallBack( "ImageDialog._setStatus" );
      document.ftpappl.setFileCompleteCallBack( "ImageDialog._finished" );
      document.ftpappl.setFtpCompleteCallBack( "ImageDialog._allfinished" );
      document.ftpappl.setFileSelectCallBack( "ImageDialog._setFilesSelected" );
      document.ftpappl.setAccessCode(this._currSecurityKey);
      document.ftpappl.getFiles(true);
    } 
    else 
    {
      alert("Please enable the FTPApplet java applet.");        
    }
  },

  addDirectory : function() {
      var that = this;

      // Show popup for directory name (popup will call callback to initiate a refresh).
      tinyMCE.activeEditor.windowManager.open({
            file : tinyMCEPopup.params.plugin_url + '/newdir.htm',
            title : 'New Directory',
            width : 330,  // Your dimensions may differ - toy around with them!
            height : 80,
            resizable : "no",
            inline : "yes",  // This parameter only has an effect if you use the inlinepopups plugin!
            close_previous : "no"
        }, {
            refreshFn : function(dirpathname) {
               var params = "";

               if ( dirpathname.length > 0)
               {

                   if( dirpathname.indexOf( that._currDirectory ) != 0 )
                   {
                       if( that._currDirectory != "/" )
                       {
                           dirpathname = that._currDirectory + "/" + dirpathname;
                       }
                       else
                       {
                           dirpathname = "/" + dirpathname;
                       }
                   }

                   params = "action=addFolder&path=" + dirpathname ;

                   that._sendAjaxRequest( params , function(responseXML)
                   {
                       var failedNodeList = responseXML.getElementsByTagName('failed');

                       if( failedNodeList.length > 0 )
                       {
                           tinyMCE.activeEditor.windowManager.alert('Add Directory Failed:' + that._getTextNode(failedNodeList[0]) );
                       }
                       else
                       {
                           that.refresh();
                       }
                   } );
               }

            }
        });
  },

  fileCopy : function() {
      // find all selected items. Place the names (and paths) into a buffer (array of object)
        var list = document.getElementById('dirlist').getElementsByTagName('div');
        var filecount = 0;

        this._fileList = "COPY";
        

        for( var i = 0; i < list.length; ++i )
        {
            if( list[i].className && list[i].className == 'selected' )
            {
                var currFile = list[i].childNodes[0].getAttribute("path");
                filecount += 1;
                
                this._fileList += "|" + currFile;
            }
        }
        
        if( filecount == 0 && this._objRightClicked )
        {
            this._fileList += "|" + this._objRightClicked.getAttribute("path");
        }
  },

  filePaste : function() {
       var params = "action=paste";
         var that = this;

         if (this._fileList.substring(0,4) =='COPY')
         {
             params = "action=copy&folder=" + this._currDirectory +
                       "&files=" + this._fileList.substring(5) ;
         }

         else if (this._fileList.substring(0,3) =='CUT')
         {
             params = "action=paste&folder=" + this._currDirectory +
                       "&files=" + this._fileList.substring(4) ;
         }

         this._sendAjaxRequest( params , function(responseXML)
         {
             var failedNodeList = responseXML.getElementsByTagName('failed');

             if( failedNodeList.length > 0 )
             {
                 tinyMCE.activeEditor.windowManager.alert('Paste Failed:' + that._getTextNode(failedNodeList[0]) );
             }
             else
             {
                  that.refresh();
             }
         } );
  },

  fileDelete : function() {
      var that = this;
        var list = document.getElementById('dirlist').getElementsByTagName('div');
        var fileList = "";
        var countOfFile = 0;

        for( var i = 0; i < list.length; ++i )
        {
            if( list[i].className && list[i].className == 'selected' )
            {
                var currFile = list[i].childNodes[0].getAttribute("path");

                if( countOfFile > 0 )
                {
                    fileList += "|";
                }

                fileList += currFile;
                ++countOfFile;
            }
        }
        
        var dirFlag = false;
        if( countOfFile == 0 && this._objRightClicked )
        {
            if( this._objRightClicked.className == "folder" ||
                 this._objRightClicked.className == "dirItem" )
            {
                dirFlag = true;
            }
        
            fileList = this._objRightClicked.getAttribute("path");
            countOfFile = 1;
        }

        // Popup alert to ask if the user is sure they want to delete the files.
        var popupMessage = "Are you sure you want to delete " + countOfFile + " files?";
        if( true == dirFlag )
        {
            popupMessage = "Are you sure you wish to delete this directory, and the files and subdirectories it contains?";
        }
        
        tinyMCE.activeEditor.windowManager.confirm(popupMessage, function(s)
        {
            if (s)
            {
              // If Yes, call webservice with list of files to delete.
                params = "action=deleteFile&folder=" + that._currDirectory +
                       "&files=" + fileList;

                that._sendAjaxRequest( params , function(responseXML) {
                    var failedNodeList = responseXML.getElementsByTagName('failed');

                    if( failedNodeList.length > 0 )
                    {
                        tinyMCE.activeEditor.windowManager.alert('Delete Failed:' + that._getTextNode(failedNodeList[0]) );
                    }
                    else
                    {
                        that.refresh();
                    }
                } );
            }
        });
  },

  fileRename : function() {
      var that = this;
      var list = document.getElementById('dirlist').getElementsByTagName('div');
      var fileList = "";

      // Look for a selected item. use the 1st one.

      for( var i = 0; i < list.length; ++i )
      {
          if( list[i].className && list[i].className == 'selected' )
          {
              fileList = list[i].childNodes[0].getAttribute("path");
              break;
          }
      }

      if( fileList.length == 0 && this._objRightClicked )
      {
          fileList = this._objRightClicked.getAttribute("path");
      }
      
      if( fileList.length == 0 )
      {
          return;
      }

      var originalName = fileList;
      if( -1 < fileList.lastIndexOf("/") )
      {
          originalName = fileList.substring(fileList.lastIndexOf("/")+1);
      }

      // Show popup for new name (popup will call callback to initiate a refresh).
      tinyMCE.activeEditor.windowManager.open({
            file : tinyMCEPopup.params.plugin_url + '/newdir.htm',
            title : 'Rename',
            width : 330,  // Your dimensions may differ - toy around with them!
            height : 80,
            resizable : "no",
            inline : "yes",  // This parameter only has an effect if you use the inlinepopups plugin!
            close_previous : "no"
        }, {
            origname : originalName,
            refreshFn : function(newname) {
               var params = "";

               if ( newname.length > 0)
               {

                   if( newname.indexOf( that._currDirectory ) != 0 )
                   {
                       if( that._currDirectory != "/" )
                       {
                           newname = that._currDirectory + "/" + newname;
                       }
                       else
                       {
                           newname = "/" + newname;
                       }
                   }

                   params = "action=renameFile&from=" + fileList + "&new="+  newname;

                   that._sendAjaxRequest( params , function(responseXML)
                   {
                       var failedNodeList = responseXML.getElementsByTagName('failed');

                       if( failedNodeList.length > 0 )
                       {
                           tinyMCE.activeEditor.windowManager.alert('Rename Failed:' + that._getTextNode(failedNodeList[0]) );
                       }
                       else
                       {
                           that.refresh();
                       }
                   } );
               }

            }
        });
  },

  fileCut : function()
  {
        var list = document.getElementById('dirlist').getElementsByTagName('div');

        var fileCount = 0;
        this._fileList = "CUT";

        for( var i = 0; i < list.length; ++i )
        {
            if( list[i].className && list[i].className == 'selected' )
            {
                var currFile = list[i].childNodes[0].getAttribute("path");

                this._fileList += "|" + currFile;
                fileCount += 1;
            }
        }

        var dirFlag = false;
        
        if( fileCount == 0 && this._objRightClicked )
        {
            if( this._objRightClicked.className == "folder" ||
                 this._objRightClicked.className == "dirItem" )
            {
                dirFlag = true;
            }

            this._fileList = "|" + this._objRightClicked.getAttribute("path");

            fileCount = 1;
        }

        

        // Popup alert to ask if the user is sure they want to cut the files.
        var that = this;

        if( fileCount > 0 )
        {
            params = "action=cutFile&folder=" + this._currDirectory +
                     "&files=" + this._fileList.substring(4) ;

            var popupMessage = "Are you sure you want to cut " + fileCount + " files?"
            if( true == dirFlag )
            {
                popupMessage = "Are you sure you want to cut this directory, and the files and subdirectories it contains?";
            }
 
            // Popup alert to ask if the user is sure they want to delete the files.
            tinyMCE.activeEditor.windowManager.confirm(popupMessage, function(s)
            {

                that._sendAjaxRequest( params , function(responseXML)
                {
                    var failedNodeList = responseXML.getElementsByTagName('failed');

                    if( failedNodeList.length > 0 )
                    {
                        tinyMCE.activeEditor.windowManager.alert('Cut Failed:' + that._getTextNode(failedNodeList[0]) );
                    }
                    else
                    {
                        that.refresh();
                    }
                } );
            } );
        }
  },

    selectFile : function( pathname )
    {
    var nl = document.forms[0].elements;
    var pathname = _httpBaseImageDir + pathname;

    nl.src.value = pathname;

        mcTabs.displayTab('general_tab','general_panel');
        this.showPreviewImage( pathname );
    },

  uploadFile : function ()
  {
      if( document.ftpappl && document.ftpappl.isActive() ) 
      {
        document.ftpappl.setAccessCode(this._currSecurityKey);
        document.ftpappl.getFiles();
      } 
      else 
      {
        document.getElementById('percent').innerHTML = "<b> java is not enabled. </b>";        
      }
  },

    selectItemForOp : function ( e )
    {
        e = (e) ? e : ((window.event) ? window.event : "");

        var currTarget = null;
        if (e.target)
            currTarget = e.target;
        else
            currTarget = e.srcElement;

        //
        // Since this event is probably bubbling up from an inner element, and not the anchor.
        // So, let's walk backwards and find the anchor... (I would use currentTarget, but
        // that doesn't work on IE)
        //
        var tmp = currTarget;
        while( null != tmp.parentNode )
        {
            if( tmp.nodeType == 1 && tmp.tagName.toLowerCase() == 'a' )
            {
                currTarget = tmp;
                break;
            }

            tmp = tmp.parentNode;
        }


        if( e.shiftKey )
        {
            // Select only items in a range. Go from the index of the item
            // selected 1st time we had a SHIFT+Click to this element.
            // De-select any not in this range.
            var list = document.getElementById('dirlist').getElementsByTagName('div');

            var lastIdx = 0;
            var currIdx = 0;

            for( var i = 0; i < list.length; ++i )
            {
                if( list[i] == this._indexFirstShiftclick )
                {
                    lastIdx = i;
                }

                if( list[i] == currTarget.parentNode )
                {
                    currIdx = i;
                }
            }

            for( var i = 0; i < list.length; ++i )
            {
                list[i].className = '';

                if( i >= Math.min(lastIdx, currIdx) && i <= Math.max(lastIdx, currIdx) )
                    list[i].className = 'selected';
            }
        }
        else if( e.ctrlKey )
        {
            // toggle this one only in the selected list.

            if( currTarget.parentNode.className != 'selected')
            {
                currTarget.parentNode.className = 'selected';
            }
            else
            {
                currTarget.parentNode.className = '';
            }

            this._indexFirstShiftclick = currTarget.parentNode;
        }
        else
        {
            // de-select the others, and select this one.

            var list = document.getElementById('dirlist').getElementsByTagName('div');
            for( var i = 0; i < list.length; ++i )
            {
                list[i].className = '';
            }

            currTarget.parentNode.className = 'selected';
            this._indexFirstShiftclick = currTarget.parentNode;
        }
    },

    _setFilePercent : function( percent )
    {
        document.getElementById('percent').innerHTML = Math.round(percent) + "%";
    },

    _setPercent : function( percent )
    {
        document.getElementById('overallpercent').innerHTML = Math.round(percent) + "%";
    },

    _setStatus : function( statusMsg )
    {
        statusMsg = statusMsg.replace(/\\/g,'/');
        document.getElementById('statusarea').innerHTML = statusMsg;
    },

    _setFilesSelected : function( inFileList )
    {
        var that = this;
        this._fileList = inFileList;

      //
      // If the user actually selected files to send...
      //
      if( inFileList.length > 0 )
      {
          //
          // Make a webservice call to set the upload directory on the server, and if successful, send the files.
          //
            this._setUploadDirectory( this._currDirectory, function() {

                // show the percentage complete bar.
                document.getElementById('progressbar').style.display='inline-block';

                // send the files
                document.ftpappl.setAccessCode(that._currSecurityKey);
                var returnCode = document.ftpappl.sendFiles(that._fileList);
            }  );
        }
    },

    _finished : function( status, filename )
    {
        if( status != true )
        {
          alert( "Error sending the file '" + filename + "'" );
        }
    },

    _allfinished : function( status )
    {
        if( status != true )
        {
            alert( "Error sending the file '" + filename + "'" );
        }
      
        //
        // Get the new access key
        //
        _currSecurityKey = document.ftpappl.getAccessCode();

        //
        // Clear the percent bar.
        //
        document.getElementById('progressbar').style.display='None';

        //
        // And refresh the list.
        //
        this._getDirContents( this._currDirectory );
    },

    _getDirContents : function( pathname )
    {
        var params = "action=listfiles&path=" + pathname;
        var that = this;
        
        this._sendAjaxRequest( params , function(dir) { that._populateCurrDir(dir); });
    },

    _setUploadDirectory : function( pathname , ftpcallbadkFn )
    {
        if( pathname == null )
        {
            pathname = currDirectory;
        }

        var params = "action=PreUploadPhoto&path=" + pathname;

        this._sendAjaxRequest( params , ftpcallbadkFn );
    },


  _populateDirTree : function( dirList )
    {
        //
        // Populate the directory list tree view from the passed in DOM.
        //
        // The treeview starts as a table.
        // For each directory, we'll have a <TR> with a spacer <TD> and a <TD> containing an anchor with an image and text,
        // after the anchor will be a <DIV>. The DIV will contain another table for each directory that contains other directory..

        // start with the parent <DIR> node.
        var treeviewarea = document.getElementById('treeview');
        treeviewarea.innerHTML = "";

        var rootNode = dirList.getElementsByTagName('response')[0];

        var currentDir = treeviewarea.appendChild(document.createElement('table'));
        currentDir.border = '0';
        currentDir.cellspacing="0"
        currentDir.cellpadding="0"

        var currRow = currentDir.insertRow(-1);

        this._populateDirNode( rootNode, currRow );
    },

    _populateDirNode : function( rootNode, domNode )
    {
        var currCell = domNode.insertCell(-1);

        if( null != rootNode )
        {
            if( rootNode.tagName == 'response')
            {
                rootNode.setAttribute('path',"");
                rootNode.setAttribute('name',"");
            }

            var hasChildren = ( rootNode.getElementsByTagName('dir').length > 0 );

            var tmpHtml = "";

            if( hasChildren )
            {
                tmpHtml += "<a class='folder' expanded='0' path='" + rootNode.getAttribute('path')+ "/" + rootNode.getAttribute('name') + "' onClick='ImageDialog.toggle(this)'>";
                tmpHtml += "<img src='img/plus.gif'></a>";
                tmpHtml += "<a path='" + rootNode.getAttribute('path')+ "/" + rootNode.getAttribute('name') + "'";
            }
            else
            {
                tmpHtml += "<img src='img/blank.gif'>";
                tmpHtml += "<a path='" + rootNode.getAttribute('path') + "/" + rootNode.getAttribute('name') + "'";
            }

            if( hasChildren )
            {
                tmpHtml += "class='folder'";
            }
            else
            {
                tmpHtml += "class='leaf'";
            }

            tmpHtml += " onClick='ImageDialog.selectLeaf( this )'>";

            if( rootNode.getAttribute('name').length  == 0 )
            {
                rootNode.setAttribute('name',"/");
            }

            tmpHtml += "<img src='img/folder_closed.png'> &nbsp; "+rootNode.getAttribute('name')+"</a>";

            currCell.innerHTML = tmpHtml;

            if( hasChildren )
            {
                var div = currCell.appendChild( document.createElement('div') );

                div.style.display='none';

                var children = rootNode.childNodes;
                for(var indx = 0; indx < children.length; ++indx )
                 {
                    if( children[indx].tagName == 'dir' )
                    {
                        var currentDir = div.appendChild( document.createElement('table') );
                        currentDir.border = '0';
                        currentDir.cellspacing="0"
                        currentDir.cellpadding="0"
                        var currRow = currentDir.insertRow(-1);
                        var currCell = currRow.insertCell(-1);
                        currCell.width='5px';

                        this._populateDirNode( children[indx], currRow );
                    }
                }
            }
        }
    },

    _populateCurrDir : function( dircontents )
    {
        var that = this;
        
        //
        // Display the directory contents using the XML passed in,
        // If there are any <dir> nodes passed back, ensure they are listed in the tree list. If
        // not, add them.
        //
        // Dirs will be shown using a special icon, and will not contain attributes "size" "width" "height" or "colors".
        // Files will contain these, and the icon will be a scaled-down version of the image name.
        //
        var treeviewarea = document.getElementById('dirlist');
        var rootNode = dircontents.getElementsByTagName('response')[0];

        var httpBaseImageDir = that._getTextNode( rootNode.getElementsByTagName('basedir')[0] );

        _httpBaseImageDir = httpBaseImageDir;

        var tmpHtml = "";

        var children = rootNode.childNodes;
        
        for(var indx = 0; indx < children.length; ++indx )
        {
            if( children[indx].tagName == 'dir' )
            {
                if( children[indx].getAttribute('path') == '/' )
                {
                    children[indx].setAttribute('path','') ;
                }

                imagefilename = 'img/opened-folder-48x48.png';
                if( children[indx].getAttribute('name') == ".." )
                {
                    imagefilename = 'img/folderback.png';
                }

                tmpHtml += "<div style='height:51px; vertical-align:middle; margin-top:5px; margin-left:5px;'> " +
                           "<a class = 'dirItem' style='height:51px;width:381px;vertical-align:middle;' path='" + children[indx].getAttribute('path') + "/" + children[indx].getAttribute('name') + "' onDblClick='ImageDialog.selectDir(\"" + children[indx].getAttribute('path') + "/" + children[indx].getAttribute('name') + "\")'>" +
                           "<img src='" + imagefilename + "' style='height:51px;vertical-align:middle;'> <span style='align:left;'> &nbsp; " + children[indx].getAttribute('name') + "</span></a></div>\n";
            }
        }

        for(var indx = 0; indx < children.length; ++indx )
        {
            if( children[indx].tagName == 'file' )
            {
                if( children[indx].getAttribute('path') == '/' )
                {
                    children[indx].setAttribute('path','') ;
                }

                tmpHtml += "<div style='height:51px; vertical-align:top; margin-top:5px; margin-left:5px;'>" +
                           "<a class='fileItem' onDblClick='ImageDialog.selectFile(this.getAttribute(\"path\"))' style='height:51px;width:381px;' path='" + children[indx].getAttribute('path') + "/" + children[indx].getAttribute('name') + "'>" +
                           "<img src='" +httpBaseImageDir + children[indx].getAttribute('path') + "/" + children[indx].getAttribute('name') + "' height='50px' width='50px' style='float:left'> " +
                           "<span style='vertical-align:top; align:left;height:51px;'> &nbsp;" + children[indx].getAttribute('name') +
                           "<br> &nbsp; " + children[indx].getAttribute('width') + "x" + children[indx].getAttribute('height') +
                           "<br> &nbsp; " + children[indx].getAttribute('size') + " bytes " +
                           "</span><br style='clear:both; height:1px;'></a></div>\n";
            }
        }

        treeviewarea.innerHTML = tmpHtml;

        var elements = treeviewarea.getElementsByTagName('a');
        for( var i in elements )
        {
            if( elements[i] && elements[i].className && elements[i].className == 'fileItem' )
            {
                if (document.attachEvent)
                {
                    elements[i].attachEvent("onclick",function(e) { return ImageDialog.selectItemForOp(e); } );
                }
                else
                {
                    elements[i].addEventListener("click",function(e) { return ImageDialog.selectItemForOp(e); }, false);
                }
            }
        }
                    
        var currPath = "";
        for(var indx = 0; indx < children.length; ++indx )
        {
            if( children[indx].tagName == 'dir' )
            {
                currPath = children[indx].getAttribute('path');
                if( currPath == "" )
                {
                    currPath = "/";
                }
                
                break;
            }
        }
            
        var treeviewNodes = document.getElementById('treeview').getElementsByTagName("a");
        for( var idx = 0; idx < treeviewNodes.length; ++ idx )
        {
            if( treeviewNodes[idx].getAttribute('path') == currPath )
            {
                this._addClass( treeviewNodes[idx], "selected" );     
            }      
            else
            {
                this._removeClass( treeviewNodes[idx], "selected" );     
            }
        }  
    },

    selectLeaf : function( node )
    {
        // Show the contents of the directory.
        if( node != null )
        {
            var pathname = node.getAttribute('path');

            this._currDirectory = pathname;

            this._getDirContents( pathname );         
        }
    },

    selectDir : function (currPath)
    {
        // A directory has been selected. Find it's node in the treeview, and if it has children, toggle it.

        var pathname = currPath;

        var treeviewNodes = document.getElementById('treeview').getElementsByTagName("a");

        var listOfDirsToExpand = currPath.split("/");

        //
        // In doing the expand, we also want to expand the parent nodes, so we'll start at root
        // and expand down to the current path node.
        //
        for( var treeIdx = 0; treeIdx < listOfDirsToExpand.length; ++treeIdx )
        {
            var currNode = listOfDirsToExpand.slice(0,treeIdx+1).join("/");

            if( currNode.length == 0)
            {
                currNode = "/";
            }

            for( var idx = 0; idx < treeviewNodes.length; ++ idx )
            {
                if( treeviewNodes[idx].getAttribute('path') == currNode && this._containsClass(treeviewNodes[idx],'folder') )
                {
                   this.expand(treeviewNodes[idx]);
                              
                   // TODO: scroll down to the directory.
                   
                   break;
                }
            }
        }             

        this._currDirectory = pathname;

        this._getDirContents( pathname );
    },

    expand : function( node )
    {
        if( node.getAttribute('expanded') == '0' )
        {
            this.toggle( node );
        }
    },

    collapse : function ( node )
    {
        if( node.getAttribute('expanded') == '1' )
        {
            this.toggle( node );
        }
    },

    toggle : function(node)
    {
        // Get the next tag (read the HTML source)
      var nextDIV = node.nextSibling;

      // find the next DIV
      while(nextDIV.nodeName != "DIV")
      {
        nextDIV = nextDIV.nextSibling;
      }

      // Unfold the branch if it isn't visible
      if (nextDIV.style.display == 'none')
      {
        // Change the image (if there is an image)
        if (node.childNodes.length > 0)
        {
          if (node.childNodes.item(0).nodeName == "IMG")
          {
              node.childNodes.item(0).src = this._getImgDirectory(node.childNodes.item(0).src) + "minus.gif";
          }
        }

        nextDIV.style.display = 'block';
        node.setAttribute('expanded','1');
      }

      // Collapse the branch if it IS visible
      else
      {
        // Change the image (if there is an image)
        if (node.childNodes.length > 0)
        {
          if (node.childNodes.item(0).nodeName == "IMG")
          {
              node.childNodes.item(0).src = this._getImgDirectory(node.childNodes.item(0).src) + "plus.gif";
          }
        }

        nextDIV.style.display = 'none';
        node.setAttribute('expanded','0');
      }
    },
    
    _addClass : function( node, className )
    {
        if( node )
        {
            if( !this._containsClass(node, className ) )
            {
                var currclassName = node.className;
                node.className = currclassName + " " + className;
            }   
        }
    },
    
    _setClass : function( node, className )
    {
        if( node )
        {
            node.className = className;
        }
    },
    
    _containsClass : function( node, className )
    {
        var returnCode = false;
        
        if( node )
        {
            var currclasses = node.className.split(" ");    
            for(var idx = 0; idx < currclasses.length; ++idx)
            {
                if( currclasses[idx] == className )
                {
                    returnCode = true;
                    break;
                }
            }
        }        
        
        return returnCode;
    },
    
    _removeClass : function( node, className )
    {
        if( node )
        {
            var currclassName = node.className;
            var newClassName = "";
                
            var currclasses = currclassName.split(" ");
            for(var idx = 0; idx < currclasses.length; ++idx)
            {
                if( currclasses[idx] != className )
                {
                    newClassName = newClassName + " " + currclasses[idx];
                }
            }
                
            node.className = newClassName.replace(/^\s*/, "").replace(/\s*$/, "");
        }
    },

    _getImgDirectory : function(source)
    {
        return source.substring(0, source.lastIndexOf('/') + 1);
    },

    _createXMLHttpRequest : function()
    {
        if (typeof XMLHttpRequest != "undefined")
        {
            return new XMLHttpRequest();
        }
        else if (typeof ActiveXObject != "undefined")
        {
            return new ActiveXObject("Microsoft.XMLHTTP");
        }
        else
        {
            throw new Error("XMLHttpRequest not supported");
        }
    },

    _sendAjaxRequest : function( params , callbackFn )
    {
       var xhtObj = this._createXMLHttpRequest();
       var that = this;

       document.body.style.cursor='wait';
       
       params = params + "&key=" + this._currSecurityKey

       xhtObj.open("POST", "ftpauthserver.php", true);
       xhtObj.onreadystatechange = function()
       {
           if (xhtObj.readyState == 4)
           {
               if( xhtObj.responseXML != null )
               {
                   if( xhtObj.responseXML.getElementsByTagName('response').length > 0 )
                   {
                       var baseresp = xhtObj.responseXML.getElementsByTagName('response')[0];                   
                       if( baseresp.getElementsByTagName('newauth').length > 0 )
                       {
                           that._currSecurityKey = that._getTextNode(baseresp.getElementsByTagName('newauth')[0]);
                       }
                   }
                   
                   callbackFn (xhtObj.responseXML);
               }

               document.body.style.cursor='default';
           }
       }

       xhtObj.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
       xhtObj.setRequestHeader("Content-length", params.length);
       xhtObj.setRequestHeader("Connection", "close");
       xhtObj.send(params);
    },

    _getTextNode : function( element )
    {
        var returnedText = "";

        if( element )
        {
            if( element.textContent )
            {
                returnedText = element.textContent;
            }
            else if( element.text )
            {
                returnedText = element.text;
            }
        }

        if( returnedText.indexOf("[CDATA[") > -1 )
        {
            returnedText = returnedText.substring(7);
        }

        if( returnedText.lastIndexOf("]]") > -1 )
        {
            returnedText = returnedText.substring(0, returnedText.lastIndexOf("]]") );
        }

        return returnedText;
    },

    _setEventListener : function( obj, event, callback )
    {
        var functionCallObj = function(e){e = (e)?e:((window.event)?window.event:null);return callback(e);};
        if( obj.attachEvent )
        {
            obj.attachEvent(event, functionCallObj );
        }
        else
        {
            event = event.substring(2,event.length).toLowerCase();
            obj.addEventListener(event, functionCallObj, false);
        }
    },

    _rightclick : function(e)
    {
        // Handle the right-click menu...
        var rightClick = false;

        if (e.which)
            rightClick = (e.which == 3);
        else if (e.button)
            rightClick = (e.button == 2);

        if( rightClick )
        {
            // Get the position of the click...
            var posx = 0;
            var posy = 0;
            if (e.pageX || e.pageY)   
            {
                posx = e.pageX;
                posy = e.pageY;
            }
            else if (e.clientX || e.clientY)  
            {
                posx = e.clientX + document.body.scrollLeft
                       + document.documentElement.scrollLeft;
                posy = e.clientY + document.body.scrollTop
                       + document.documentElement.scrollTop;
            }
            
            //
            // Get the target item in the browse list (either directory or file list)
            // Since this event is probably bubbling up from an inner element, and not the anchor.
            // So, let's walk backwards and find the anchor... (I would use currentTarget, but
            // that doesn't work on IE)
            //
            var currTarget = null;
            if (e.target)
                currTarget = e.target;
            else
                currTarget = e.srcElement;

            var tmp = currTarget;
            while( null != tmp.parentNode )
            {
                if( tmp.nodeType == 1 && tmp.tagName.toLowerCase() == 'a' )
                {
                    currTarget = tmp;
                    break;
                }
                
                if( tmp.nodeType == 1 && tmp.id.toLowerCase() == 'browser_panel' )
                {
                    currTarget = null;
                    break;
                }

                tmp = tmp.parentNode;
            }
            
            this._objRightClicked = currTarget;
            
            // if the target is the "back" directory entry, then exit without showing the menu.
            if( null != currTarget &&
                currTarget.getAttribute("path").indexOf("..") > -1 )
            {
                (e.stopPropagation) ? e.stopPropagation() : e.cancelBubble = true;
                (e.preventDefault) ? e.preventDefault() : e.returnValue = false;
                return false;
            }
            
            //
            // Now, create the popup div, if not already present.
            //
            var popupdiv = document.getElementById('filemgrrightclickmenu');
            
            if(!popupdiv)
            {
                popupdiv = document.createElement('div');
                popupdiv.className = 'filemgrpopupmenu';
                popupdiv.id = 'filemgrrightclickmenu';
                popupdiv.style.position = 'absolute';

                popupdiv.innerHTML = "<a href='#' id='filemgrpopupcut' onClick='ImageDialog._rightClickAction(this); return false;'> Cut </a>" +
                                     "<a href='#' id='filemgrpopupcopy' onClick='ImageDialog._rightClickAction(this); return false;'> Copy </a>" +
                                     "<a href='#' id='filemgrpopuppaste' onClick='ImageDialog._rightClickAction(this); return false;'> Paste </a>" +
                                     "<a href='#' id='filemgrpopupdelete' onClick='ImageDialog._rightClickAction(this); return false;'> Delete </a>" +
                                     "<a href='#' id='filemgrpopuprename' onClick='ImageDialog._rightClickAction(this); return false;'> Rename </a>";

                document.getElementsByTagName('body')[0].appendChild(popupdiv);

                this._setEventListener( popupdiv,
                                         "onmouseout", 
                                         function(e) { 
                                             ImageDialog._rightClickMenuHide(e);
                                             return false; 
                                         } );
            }

            // Get the bounding box for the popup div. This will be the document size.
            
            var boundingwidth = popupdiv.parentNode.offsetWidth;
            var boundingheight = popupdiv.parentNode.offsetHeight;
            
            var popupwidth = 0;
            var popupheight = 0;
                        
            if( window.getComputedStyle )
            {            
                popupwidth = parseInt(getComputedStyle(popupdiv, null).getPropertyValue("width"));
                popupheight = parseInt(getComputedStyle(popupdiv, null).getPropertyValue("height"));
            }
            else
            {
                popupwidth = parseInt(popupdiv.currentStyle.width);
                popupheight = parseInt(popupdiv.currentStyle.height);
            }
           
            if( posx + popupwidth > boundingwidth )
            {
                posx = boundingwidth - popupwidth;
            }

            if( posy + popupheight > boundingheight )
            {
                posy = boundingheight - popupheight;
            }

            // Position the popup at the proper place
            popupdiv.style.left = posx + "px";
            popupdiv.style.top = posy + "px";
            popupdiv.style.display = 'block';

            (e.stopPropagation) ? e.stopPropagation() : e.cancelBubble = true;
            (e.preventDefault) ? e.preventDefault() : e.returnValue = false;
            return false;
        }
    },

    _rightClickAction : function( e )
    {
        // See if we have one or more items highlighted.
        var list = document.getElementById('dirlist').getElementsByTagName('div');

        var fileCount = 0;

        for( var i = 0; i < list.length; ++i )
        {
            if( list[i].className && list[i].className == 'selected' )
            {
                fileCount = 1;  
                break;
            }
        }        
        
        // So, now if we have a selected item or items, lets perform the appropriate action...
        if( fileCount > 0 || this._objRightClicked != null || e.id == 'filemgrpopuppaste' )
        {
            if( e.id == 'filemgrpopupcut' )
            {
                this.fileCut();
            }
            else if( e.id == 'filemgrpopupcopy' )
            {
                this.fileCopy();
            }
            else if( e.id == 'filemgrpopuppaste' )
            {
                this.filePaste();
            }
            else if( e.id == 'filemgrpopupdelete' )
            {
                this.fileDelete();
            }
            else if( e.id == 'filemgrpopuprename' )
            {
                this.fileRename();
            }            
        }
        
        this._rightClickMenuHide(e);
        
        return false;
    },

    _rightClickMenuHide : function( e )
    {
        var popupdiv = document.getElementById('filemgrrightclickmenu');
        var popuptop = 0;
        var popupleft = 0;
        var popupwidth = 0;
        var popupheight = 0;
        
        // If the mouse is outside of the popup menu, then hide it.
        if( window.getComputedStyle )
        {            
            popuptop = parseInt(getComputedStyle(popupdiv, null).getPropertyValue("top"));
            popupleft = parseInt(getComputedStyle(popupdiv, null).getPropertyValue("left"));
            popupwidth = parseInt(getComputedStyle(popupdiv, null).getPropertyValue("width"));
            popupheight = parseInt(getComputedStyle(popupdiv, null).getPropertyValue("height"));
        }
        else
        {
            popuptop = parseInt(popupdiv.currentStyle.top);
            popupleft = parseInt(popupdiv.currentStyle.left);
            popupwidth = parseInt(popupdiv.currentStyle.width);
            popupheight = parseInt(popupdiv.currentStyle.height);
        }
        
            // Get the position of the click...
            var posx = 0;
            var posy = 0;
            if (e.pageX || e.pageY)   
            {
                posx = e.pageX;
                posy = e.pageY;
            }
            else if (e.clientX || e.clientY)  
            {
                posx = e.clientX + document.body.scrollLeft
                       + document.documentElement.scrollLeft;
                posy = e.clientY + document.body.scrollTop
                       + document.documentElement.scrollTop;
            }

            if( posx < popupleft || posx > popupleft + popupwidth ||
                posy < popuptop || posy > popuptop + popupheight )
            {
                popupdiv.style.display = 'none';
            }	
    }
};

ImageDialog.preInit();
tinyMCEPopup.onInit.add(ImageDialog.init, ImageDialog);
