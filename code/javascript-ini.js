/*
  JavaScript-ini 
  Load and save ini file for JavaScript apps and build the user interface.
  (c) Copyright 2012 Denis Sureau.  
  Provided under the MIT License.
  Use it freely but keep this copyright notice. 
*/

var socket = io.connect();
var form = "";

function addLabel(value)
{
	form+="<div class='label'>" + value + "</div>";
}

function addSelect(name, initial, arr)
{
	form += "<select name='"+ name + "' id='" + name+ "'>";

	for(var i = 0; i < arr.length; i++)
	{
		var opt = arr[i];
		form += "<option";
		if(opt == initial)
			form += " selected";
		form += ">";
		form += opt;
		form += "</option>";
	}
	form += "</select>";
}

function addInput(name, initial)
{
	form += "<input type='text' name='" + name + "' id='" + name + "' value='" + initial + "'>";
}

function addCheck(name, initial)
{
	form += "<input type='checkbox' name='" + name + "' id='" + name +
		 "' value='"+ initial+"'";
	if(initial == true) 
		form += " checked";
	form += "/>";
}

function updateEntry(innarr)
{
	var initial = '';
	var name = '';
	var element = null;
  
	for(var option in innarr)
	{
  	switch(option)
		{
			case 'list':
				var garr = innarr[option];
				for(var i = 0; i < garr.length; i++)
				{
					updateEntry(garr[i]);
				}
				break;
			case 'name':
				name = innarr[option];      
				element = document.getElementById(name);
				break;
			case 'initial':
				initial = innarr[option];
				break;
			case 'select':
				var value = element.options[element.selectedIndex].value;
				innarr['initial'] = value;	
				break;
			case 'input':
				innarr['input'] = element.value;				
				break;
			case 'checkbox':
				innarr['checkbox'] = element.checked;							
				break;
			default:
				break;
		}
    //alert(option + ' exit:' + JSON.stringify(innarr));
	}
	//alert('Exit update:' + JSON.stringify(config));
}

function update(config)
{
	for(var group in config)
	{
		updateEntry(config[group]);	
	}
}

function done(content) { alert(content); }
function serverSave(filename)
{
 	var content= 'var config=' + JSON.stringify(config, null, 4);
  var a = {  'app': 'explorer', 'params' : { 
        'command': 'savesys', 'filename': filename, 'content': content  } };
  socket.emit('interface', a);    
}
function saveIni(filename)
{
	update(config);
  serverSave(filename);
}

function saveFromAE(filename, cfg)
{
  config = cfg;
  serverSave(filename);
}

function parseGroup(innarr)
{
	var initial = '';
	var name = '';
	for(var option in innarr)
	{
		switch(option)
		{
			case 'list':
				var garr = innarr[option];
				for(var i = 0; i < garr.length; i++)
				{
					parseGroup(garr[i]);
					form +="<br>";
				}
				break;
			case 'label':
				addLabel(innarr[option]);
				break;
			case 'name':
				name = innarr[option];
				break;
			case 'initial':
				initial = innarr[option];
				break;
			case 'select':
				addSelect(name, initial, innarr[option]);
				break;
			case 'input':
				addInput(name, innarr[option]);
				break;
			case 'checkbox':
				addCheck(name, innarr['checkbox']);			
				break;
			default:
				break;
		}
	}
}

function iniSetup(cfg, inifile)
{
  form ="";
  config = cfg;
  for(group in config)
  {
	 form += "<p class='group'>" + group + "</p>";
	 parseGroup(config[group]);	
  }
  form += "<p><input type='button' onclick='saveIni(\""+inifile+"\")' value='Update Configuration'></p>";
  var target = document.getElementById("options");
  target.innerHTML = form;
}  