/* File Chooser
   File input replacement with path and default value
   for local use of JavaScript on the desktop.
   (c) 2012 By Denis Sureau.
   
   License LGPL 3.0.
   Free to use provided this copyright notice is not removed.

   Requires:
   - Node.js.
   - A WebSocket connection opened with the server.
   - The Explorer.js module.
*/


var currentpath = new Array();
var insidezip = new Array();
var elementToSelect = null;
var elementToOffset = null;

function fileButton(target)
{
	var filepath = currentpath[target];  // to do : be persistent
	var query = { 'app' : 'explorer', 'params': { 'path' : filepath, 'command': 'getdir', 'target': target } } ;
  socket.emit('interface', query);
}

function pathJoin(path, filename)
{
  var last = path.slice(-1);
  if(last != '/' && last != '\\')
    return path + "/" + filename;
  return path + filename;
}

function replaceFilename(path, name)
{
  var lio = path.lastIndexOf("/");
  return path.slice(0, lio +1) + name;
}

function buildDir(filepath, fname, id)
{
	var balise ="<div class='dir' onDblClick='chDir(\"" + fname + "\",\"" + id + "\")' onClick='sel(this)' oncontextmenu='return dsel(this)'>";
  balise += '<img src="images/dir.png">';
	balise += fname;
	balise += "</div>";
	return(balise);
}


function buildLink(filepath, fname, panelid, timesize, ext)
{
	filepath = filepath.replace(/\\/gi, '/');
  var sep = '/';
  if(filepath.slice(-1) == '/')   sep = '';
	var fpath = filepath + sep + fname;
	var balise ="<div class='file' onDblClick='view(this, \"" + fpath+ "\",\"" + panelid + "\")' onClick='sel(this)' oncontextmenu='return rsel(this)'>";
  balise += '<img src="';
  ext=ext.toLowerCase();
  switch(ext)
  {
    case 'gif':
    case 'jpg':
    case 'png':
    case 'jpeg':
          balise += 'images/img.png';
          break;
    case 'htm':
    case 'html':
    case 'php':
    case 'asp':
          balise += 'images/web.png';
          break;  
    case 'zip':
          balise += 'images/zip.png';
          break;
    case 'bak':
    case 'tmp':
          balise += 'images/trash.png';
          break;  
    case 'exe':
    case 'jar':
          balise += 'images/app.png';
          break;                           
    default:
          balise += 'images/doc.png'
  }
  balise += '">'; 
	balise += fname;
  balise += '<span class="timesize">' + timesize + '</span>'; 
	balise += '</div>';
	//balise += " (" + fpath + ")";
	return(balise);
}



/* File Display
  Display a list of files and directories.
  Filtered to images.
  - Call buildLink on images.
  - Call buildDir on directories.
  
  Input: the id of the tag to store the list, 
  and the list as an array of name and the common path.

*/

function imageList(content)
{
	//alert(target);
  var target = content.target;
	var d = document.getElementById(target);
 	//alert("filedisplay  target:" + d + " content: " + content);
	var filepath = content['path'];
	var dir = content['list'];
	var page = "<div class='filechooser'>";
	page += "<p class='path'>" + filepath + "</p>";
	page += "<div class='files'>";
	var dirlist = "";
	var filelist ="";
	for(var i = 0; i < dir.length; i++)
	{
		var item = dir[i];
		var type = item[0];
		var name = item[1];

		if(type=='dir')
		{
			dirlist += buildDir(filepath, name, target) + "<br>";
		}
		else
		{
      var timesize = item[2];     
			var p = name.lastIndexOf('.');
			var ext = name.slice(p + 1);
			switch(ext) {
  			case 'gif':
	   		case 'png':
		  	case 'jpg':
        case 'jpeg':
             break;
        default: continue;
			}
			filelist += buildLink(filepath, name, target, timesize, ext) + "<br>";      
		}
	}
	page += dirlist;
	page += filelist;
	page += "</div>";
	page += "</div>";
	d.innerHTML = page;
}

/*
  Displays a list of files and dirs.
  Called by the interface when a 'dirdata' event is received
  from the server.
*/

function fileList(content)
{
	//alert(content.iskb);
  
  var target = content.target;
  insidezip[target]=content.iszip;
  
	var d = document.getElementById(target);
  var extmask = content.extmask; 

	//alert("filedisplay  target:" + d + " content: " + content);
	var filepath = content['path'];
  
  var fpathid = content.target + "path";
  var fpath = document.getElementById(fpathid);
  fpath.value = filepath;
  
  var listid = content.target + "list";
	var dir = content['list'];
	var page = "<div class='filechooser'>";
	//page += "<p class='path'>" + filepath + "</p>";
	page += "<div class='flist' id='"+ listid +"' tabindex='0'>";
	var dirlist = "";
	var filelist ="";
	for(var i = 0; i < dir.length; i++)
	{
		var item = dir[i];
		var type = item[0];
		var name = item[1];

		if(type=='dir')
		{
      dirlist += buildDir(filepath, name, target) + "<br>";
		}
		else
		{
      var timesize = item[2];    
			var p = name.lastIndexOf('.');
			var ext = name.slice(p + 1);
			if(extmask && ext != extmask) continue; 
			filelist += buildLink(filepath, name, target, timesize, ext) + "<br>";
		}
	}
	page += dirlist;
	page += filelist;
	page += "</div>";
	page += "</div>";
	d.innerHTML = page;
  //alert(page); 
  addKeyListEvents(target);

  //alert(elementToSelect);
  if(elementToSelect != null)
  {
    if(elementToSelect == '*')
      setFirstSelected(target);
    else
    {
      chooserLastSelected = null;
      elementToSelect = getElementByName(elementToSelect, target);
      sel(elementToSelect);
    } 
  }     
  elementToSelect = null;
  elementToOffset = null;
 
  var currdiv = document.getElementById(listid);
  currdiv.focus();
  
}

// change dir called by the interface

function chDir(filepath, target)
{
	if(filepath.slice(0, 8) == "file:///")
		filepath = filepath.slice(8);

	var a = {  'app': 'explorer', 
             'params' : { 
                   'file': 'code/chooser.js', 
                   'command': 'chdir', 
                   'path': filepath,
                   'target': target 
                  }
          };
	socket.emit('interface', a);
}

function unlocalize(filepath)
{
 	if(filepath.slice(0, 8) == "file:///") return(filepath.slice(8));
  return(filepath);    
}      

function view(element, filepath, panelid, forcePage)
{
  if(insidezip[panelid]) // always displayed like a page
  {
    var filename = getNameSelected(element);
    var archive = document.getElementById(panelid +'path').value; 
    var a = {  'app': 'explorer', 'params' : { 
         'command': 'textinzip',
         'archive': archive,
         'entryname': filename
         }
      };
    socket.emit('interface', a);    
    return;
  }   
  filepath = replaceFilename(filepath, getNameSelected(element));
  //alert(filepath);  
  var p = filepath.lastIndexOf('.');
	var ext = filepath.slice(p + 1);
  
  if(forcePage) ext ='';
  
  switch(ext.toLowerCase())
  {
    case 'gif':
    case 'png':
    case 'jpg':
    case 'jpeg':  
      var a = {  'app': 'explorer', 'params' : { 
        'command': 'loadimage', 'path': filepath, 'target': panelid } };
      socket.emit('interface', a);
      break;
    case 'zip':
      var a = {  'app': 'explorer', 'params' : { 
         'command': 'viewzip', 'path': filepath, 'target': panelid } };
      socket.emit('interface', a);
      break;
    case 'exe':
    case 'jar':
      var a = {  'app': 'explorer', 'params' : { 
         'command': 'execute', 'filename': null, 'path': filepath,'target': panelid } };
      socket.emit('interface', a);
      break;
    default:
     	if(filepath.slice(0, 5) != 'http:')
	     filepath = "file:///" + filepath;
      var a = {  'app': 'explorer', 'params' : { 
        'command': 'viewtext', 'path': filepath, 'target': panelid  } };
      socket.emit('interface', a);
      break;    
  }  
        
}

function nodeClear(node)
{
  var child = node.firstChild;
  while(child)
  {
    child.className="file";
    child = child.nextSibling;
  }  
}

function deselectAll(parent)
{
	var child = parent.firstChild; // child of flist
  //alert(parent + " " + parent.innerHTML);
	while(child)
	{
    if(child.className == 'entrybold')
		{
      child.className="file";  
		}
		child = child.nextSibling;
	}  	  
}

var chooserLastSelected = null;

function setSelected(element)
{
    element.className="entrybold";	     
}

function selectRange(item1, item2)
{
  var parent = item1.parentNode;
  var inRange = false;
  var skipFollowers = false;
  var counter = 0;
  //alert(parent + " " + item1 + " " + item2);

 	var child = parent.firstChild;  
	while(child)
	{
    if(child.className == 'dir' || child.className == 'file' || child.className=='entrybold') 
    {
      if(skipFollowers == false)
      {
        if(item1==child)
        {
          setSelected(child);
          inRange=true;
          counter++;
          if(counter==2) skipFollowers = true; 
		      child = child.nextSibling;        
          continue;
        }
        if(item2==child)
        {
          setSelected(child);
          inRange=true;
          counter++;
          if(counter==2) skipFollowers = true;
		      child = child.nextSibling;        
          continue;
        }
        if(inRange)
        {
          setSelected(child);
		      child = child.nextSibling;        
          continue;
        }
      }
      if(child.className == 'entrybold')
		  {
        child.className="file";    
		  }
    }
		child = child.nextSibling;
	}  	  
  chooserLastSelected = null;
}

function sel(element)
{
  //alert(chooserLastSelected);
  if(isSHIFT)
  {
    if(chooserLastSelected != null)
    {
      selectRange(chooserLastSelected, element);
      chooserLastSelected = null;
      isSHIFT = false;    
      return;
    }
  }

  if(element.className == 'entrybold' && !isSHIFT)
  {
    element.className="file";
  }
  else
  {
    if(!isCTRL) deselectAll(element.parentNode);
    element.className="entrybold"; 
  }    
  chooserLastSelected = element;

  isSHIFT = false;
}

/*
  Context menu
*/  


var xMousePosition = 0;
var yMousePosition = 0;

document.onmousemove = function(e)
{
  xMousePosition = e.clientX + window.pageXOffset;
  yMousePosition = e.clientY + window.pageYOffset;
};

function pointFile(element)
{
  deselectAll(element.parentNode);
  element.className='entrybold';
	var parent = element.parentNode.parentNode.parentNode; 
  return parent.id; 	
}

function getPointedContent(panelName)
{
	var slist = getSelected(panelName);
	if(slist.length != 1)
	{
		alert(slist.length + " selected. Select just one file or directory to rename, please.");
		return null;
	}
	return slist[0];
}


function edit(element)
{
  var target = pointFile(element);
	var filename =  getNameSelected(element);
	var a = { 'app' : 'explorer',
			  'params': { 'command': 'getcontent', 'path': filename, 'target': target }
	};
	
	socket.emit('interface', a);
}

function open(element, forcePage)
{
  var target = pointFile(element);
  var fpathid = target + "path";
  var fpath = document.getElementById(fpathid);
  filepath = fpath.value;
  var fname =  getNameSelected(element);
  //alert(filepath + " " + fname);
  filepath = filepath.replace(/\\/gi, '/');
  var sep = '/';
  if(fname.slice(-1) == '/') sep = '';
  var fname = filepath + sep + fname;
  view(element, fname, target, forcePage);
}

function copyRename(element)
{
  var oldname = getNameSelected(element);
	var newname = prompt("New name:", oldname);
	if(newname == null || newname == "") return;
  
  var sourcepath = pathJoin(currentpath['lcontent'], oldname);
  var targetpath = pathJoin(currentpath['lcontent'], newname);
  if(sourcepath == targetpath)
  {
  	alert("Can't copy a file over itself!");	
		return;
  }
  
	var a = { 'app' : 'explorer', 'params': { 
     'command': 'copyrename', 'oldname': oldname, 'newname':newname, 
     'source' : 'lcontent', 'target': 'rcontent',
     'isDirectory': isDirectory(element) }
	};
	socket.emit('interface', a);	
}

function rsel(element)
{
  var x = document.getElementById('ctxmenu1');
  if(x) x.parentNode.removeChild(x); 
  
  var parent = element.parentNode; 
  var isImage;
  var isExecutable = false;
  var ext = getNameSelected(element);
  var epos = ext.lastIndexOf('.');
	ext = ext.slice(epos + 1);  
  switch(ext.toLowerCase())
  {
    case 'exe':
    case 'jar':
      isExecutable = true;
      break;
    case 'gif':
    case 'png':
    case 'jpg':
    case 'jpeg':
      isImage = true;
      break;
    default: isImage = false;
  }
 
  var d = document.createElement('div');
  parent.appendChild(d);
  
  d.id = 'ctxmenu1';
  d.className = 'ctxmenu';
  d.style.left = xMousePosition + "px";
  d.style.top = yMousePosition + "px";
  d.onmouseover = function(e) { this.style.cursor = 'pointer'; } 
  d.onclick = function(e) { parent.removeChild(d);  }
  document.body.onclick = function(e) {
    try { parent.removeChild(d);}
    catch(e) {}   
  }
  
  var p = document.createElement('p');
  d.appendChild(p);
  p.onclick=function() { open(element, false) };
  p.setAttribute('class', 'ctxline');
  p.innerHTML = "Open"; 
  
  if(isExecutable)
  {
    var pe = document.createElement('p');
    d.appendChild(pe);
    pe.onclick=function() { run(element, true); };
    pe.setAttribute('class', 'ctxline');
    pe.innerHTML = "Run";    
  }   
  
  if(isImage)
  {
    var pi = document.createElement('p');
    d.appendChild(pi);
    pi.onclick=function() { open(element, true); };
    pi.setAttribute('class', 'ctxline');
    pi.innerHTML = "Full view";    
  }
    
  var p2 = document.createElement('p');
  d.appendChild(p2);
  p2.onclick=function() { edit(element) };  
  p2.setAttribute('class', 'ctxline');
  p2.innerHTML = "Edit"; 

  var target = pointFile(element);
  
  var p = document.createElement('p');
  d.appendChild(p);
  p.onclick=function() { elementRename(element, target); };
  p.setAttribute('class', 'ctxline');
  p.innerHTML = "Rename"; 

  if(target == 'lcontent')
  {
	  var p = document.createElement('p');
	  d.appendChild(p);
	  p.onclick=function() { copyRename(element) };
	  p.setAttribute('class', 'ctxline');
	  p.innerHTML = "Copy/Rename"; 
  }
  return false;
}

function openDir(element)
{
  var target = pointFile(element);
  var dirname = getNameSelected(element);
  chDir(dirname, target, false);
}

function run(element)
{
  var target = pointFile(element);
  var fname = getNameSelected(element);
	var a = { 'app' : 'explorer',
			  'params': { 'command': 'execute', 'target': target, 'filename': fname }
	};  
	socket.emit('interface', a, function(data){
		alert(data);								 
	});	
  
}

function dirinfo(element)
{
  var target = pointFile(element);
  var fname = getNameSelected(element);
	var a = { 'app' : 'explorer',
			  'params': { 'command': 'dirinfo', 'target': target, 'filelist': [fname] }
	};  
	socket.emit('interface', a, function(data){
		alert(data);								 
	});	  
}

function dsel(element)
{
  var x = document.getElementById('ctxmenu2');
  if(x) x.parentNode.removeChild(x); 
  var parent = element.parentNode; 

  var d = document.createElement('div');
  parent.appendChild(d);
  d.id = 'ctxmenu2';
  d.className = 'ctxmenu';
  d.style.left = xMousePosition + "px";
  d.style.top = yMousePosition + "px";
  d.onmouseover = function(e) { this.style.cursor = 'pointer'; } 
  d.onclick = function(e) { parent.removeChild(d);  }
  document.body.onclick = function(e) {
    try { parent.removeChild(d);}
    catch(e) {}   
  }
  
  var p = document.createElement('p');
  d.appendChild(p);
  p.onclick=function() { openDir(element) };
  p.setAttribute('class', 'ctxline');
  p.innerHTML = "Open";  
    
  var p2 = document.createElement('p');
  d.appendChild(p2);
  p2.onclick=function() { dirinfo(element) };  
  p2.setAttribute('class', 'ctxline');
  p2.innerHTML = "Informations"; 
  
  var p3 = document.createElement('p');
  d.appendChild(p3);
  p3.onclick=function() { elementRename(element, pointFile(element)); };
  p3.setAttribute('class', 'ctxline');
  p3.innerHTML = "Rename";   
  
  var target = pointFile(element);  
  if(target == 'lcontent')
  {
    var p4 = document.createElement('p');
    d.appendChild(p4);
    p4.onclick=function() { copyRename(element) };
    p4.setAttribute('class', 'ctxline');
    p4.innerHTML = "Copy/Rename"; 
  }  
 
  return false;
}


/*
  getSelected(panelname)
  Return the list of selected items in a panel
  Items are <div> tags
*/

function getSelected(source)
{      
  var source = document.getElementById(source);
	var parent = source.firstChild;	// chooser
	var slist = new Array();
	var child = parent.firstChild.firstChild; // flist.filename
	while(child)
	{
		if(child.className == 'entrybold')
		{
			slist.push(child);
		}
		child = child.nextSibling;
	}  	
	return slist;  
}

function setFirstSelected(target)
{
  var panel = document.getElementById(target);
  var element = panel.firstChild.firstChild.firstChild;
  chooserLastSelected = null;
  sel(element);
}

/* Extract name of selected item */

function getNameSelected(item)
{
    var data = item.innerHTML;
    var p = data.indexOf('>');
    var name = data.slice(p + 1);
    p = name.indexOf('<');
    if(p > 0)
      name = name.slice(0, p);
    return name;  
}

/* Get element from name in list */

function getElementByName(name, source)
{
  var s = document.getElementById(source);
	var child = s.firstChild.firstChild.firstChild; // flist.filename
	while(child)
	{
		if(getNameSelected(child) == name)
			return child;
  	child = child.nextSibling;
	}  	
	return null;  
}

/* check if directory from picture */

function isDirectory(item)
{
    var img = item.firstChild;
    return img.src.indexOf("dir.png") != -1;
}

/*
  getSelectedNames(panelname)
  Return the list of selected filename or dirnames
*/

function getSelectedNames(source)
{
  var namelist = new Array();
  var slist = getSelected(source);
  //alert(slist);
	for(i = 0; i < slist.length; i++)
	{
    var elem = slist[i].innerHTML;
    var p = elem.indexOf('>');
    elem = elem.slice(p+1);
    p = elem.indexOf('<');
    if(p > 0)
      elem = elem.slice(0, p);
    if(elem=='') continue;      
    namelist.push(elem);
  }
  //alert("selection : " + namelist.join(' '));
	return namelist;    
}

/*
  selectToDelete(panelname)
  Cross files selected to be deleted
*/  

function selectToDelete(source)
{
  var slist = getSelected(source);
	for(i = 0; i < slist.length; i++)
	{
		var element = slist[i];
    element.style.backgroundColor = 'white';
    element.style.textDecoration = 'line-through';
    element.style.color = 'red';
	}
}

var isCTRL = false;
var isSHIFT = false;
document.onkeyup=function(evt)
{
	if(!evt.ctrlKey) isCTRL=false;
  if(!evt.shiftKey) isSHIFT = false;
}

document.onkeydown=function(evt)
{
  if(evt.shiftKey) isSHIFT = true;
              else isSHIFT = false;
  //alert(document.activeElement);
  var code = (evt.keyCode || evt.which);
  //alert("chooser " + code);
  switch(code)
  {  
      case 13:
        return true;
      case 37: // left
      case 38: // up
      case 40: // down
        evt.preventDefault(); 
        evt.returnValue = false;     
        passHandler(evt, code);
        return true;    
  }
  
  if(evt.ctrlKey)
  {
    isCTRL = true;
    //alert("chooser " + code);    
    switch(code)
    {
      case 17: // ctrl key
        break;
		  case 67:  // ctrl-c
        //alert("ctrl-c");
        evt.preventDefault();
        evt.returnValue = false;
        passHandler(evt, code);
        isCTRL = false;
        break;
      case 73: // ctrl-i
        break;  
      case 85: // ctrl-u
        //alert(code);
        evt.preventDefault();
        evt.returnValue = false;
        passHandler(evt, code);
        isCTRL = false;
        break;
      default:
        //alert("Bad key code: " + code);
        break;       
    }
    return true;
  }
  
  isCTRL = false;
  return true;
}

