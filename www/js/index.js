/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};



var resultMedias=[];
var imgs = document.getElementsByName('postIMGs');
var medias = [{mediaType: "image", path:'', size: 0}];
var imageSelected = 0;
var thumb_index = 0;
var args = {    'selectMode': 100, //101=picker image and video , 100=image , 102=video
    'maxSelectCount': 5, //default 40 (Optional)
    'maxSelectSize': 188743680, //188743680=180M (Optional) only android
};


var images_to_upload =  [];

 

function update_images_to_upload(resultMedias) {
    
    
    for (var i = 0; i < resultMedias.length; i++) {

    
        MediaPicker.extractThumbnail(resultMedias[i], function(data) {

            images_to_upload.push(data);
            renderThumbnailUI();
            
        }, function(e) { console.log(e) });
    }
}

document.getElementById("cameraTakePicture").addEventListener("click", TakePicture);


function RemovePicture(data){
    //for (var i = 0; i < images_to_upload.length; i++) {
     //   if(i == data.id)
            images_to_upload.splice(data.id, 1);
            renderThumbnailUI();
    //}
}


function renderThumbnailUI() {

    var thumbnailHtml = '<div>';

   
    for (var i = 0; i < images_to_upload.length; i++) {
       var curImg = images_to_upload[i];

        thumbnailHtml += '<div class="postIMGspace"></div><div class = "postIMGs"><img id="postIMG'+i+'" src = "'+  'data:image/jpeg;base64,' + curImg.thumbnailBase64 +'" name="postIMGs"  class="IMGs"/><button class="remove" data-id="'+i+'" id = "'+i+'" onClick="RemovePicture(this)">&times</button></div>';

    }
    for (var j = images_to_upload.length ; j < 5 ; j++){
        thumbnailHtml += '<div class="postIMGspace"></div><div class = "postIMGs"><img id="postIMG'+j+'"  name="postIMGs"  class="IMGs"/></div>';
    }

    thumbnailHtml += '</div>';
    
    document.getElementById("cpImages").innerHTML = thumbnailHtml;

}

function TakePicture() {
    
    args.maxSelectCount = 5 - images_to_upload.length;
    
    MediaPicker.getMedias(args, function(medias) {
        //medias [{mediaType: "image", path:'/storage/emulated/0/DCIM/Camera/2017.jpg', uri:"android retrun uri,ios retrun URL" size: 21993}]
        resultMedias = medias;

        update_images_to_upload(resultMedias);
        //storeImages(medias);
    }, function(e) { console.log(e) })
    
}


function uploadData(){

    $('#uploadStatus').html('Uploading Data...');
    console.log( $('#cpLabel').html() + "Ok, going to upload "+images_to_upload.length+" images.");
    var defs = [];
    var comment = $('#txtNewPostID').val();

    console.log(comment);

    var fd = new FormData();
    var j = 0;
    images_to_upload.forEach(function(i) {
        var init_i = i;
        var i = i.uri; 
        console.log(i);
        var def = $.Deferred();

        console.log("hello1");

        console.log(window.resolveLocalFileSystemURL);

        window.resolveLocalFileSystemURL(i, function(fileEntry) {
            console.log("hello2");
            console.log('got a file entry');
            fileEntry.file(function(file) {
                console.log('now i have a file ob');
                
                var reader = new FileReader();
                reader.onloadend = function(e) {
                    var imgBlob = new Blob([this.result], { type:file.type});
                    fd.append('file'+(images_to_upload.indexOf(init_i)), imgBlob);
                    fd.append('fileName'+(images_to_upload.indexOf(init_i)), file.name);
                    fd.append('comment', comment);
                    console.log(fd);
                    def.resolve();
                };
                reader.readAsArrayBuffer(file);
                
            }, function(e) {
                console.log('error getting file', e);
            });         
        }, function(e) {
            console.log('Error resolving fs url', e);
        });

        defs.push(def.promise());
            
    });

    $.when.apply($, defs).then(function() {
        console.log("all things done");
        var request = new XMLHttpRequest();
        request.open('POST', 'https://app.iqgrain.com/custom/upload.php');
        request.send(fd);
        console.log(request);
        console.log(request.responseText);
        request.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
              $('#uploadStatus').html('<span style="color:#348017">Upload successfull</span>');
            }
        };
        
        
        
    });

}
