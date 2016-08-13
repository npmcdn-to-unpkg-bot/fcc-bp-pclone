//var globalInst;
var ngApp = angular.module('fcc-bp-pclone', ['ui.router', 'ngAnimate']);
ngApp.config(function ($stateProvider, $urlRouterProvider) {
    console.log("Inside router!!!");
    console.log(typeof $urlRouterProvider);
    $urlRouterProvider.otherwise('/home'); //Where we go if there is no route

    // templateProvider: Provider function that returns HTML content string. See http://angular-ui.github.io/ui-router/site/#/api/ui.router.state.$stateProvider
    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: 'home'
        })
        .state('logout', {
            url: '/logout',
            templateUrl: 'logout'
        })
        .state('mypins', {
            url: '/mypins',
            templateUrl: 'mypins' //Resolves to newpoll.pug in routes.js
        })
        .state('newpin', {
            url: '/newpin',
            templateUrl: 'newpin'
        })
        .state('recent', {
            url: '/recent',
            templateUrl: 'recent'
        });
    
    //When a user returns from auth
    $stateProvider.state('loginRtn', {
        url: '/loginRtn',
        templateUrl: 'loginrtn'
    });
    
});

ngApp.controller('logout', function($scope, $http) {
    $scope.$on('$stateChangeSuccess', function() { 
        console.log("%c At logout!", "color:blue; font-size:20px");
        document.location.href = "/"; //The purpose of this is to break out of the UI-Router container as the header will now be different (i.e., the Sign Out button will now be a Sign In button)
    });
});

ngApp.controller('newPin', function($scope, $http) {
    $scope.addPin = function() {
        console.log("%c Add Pin called", "color:blue; font-size:16px");
        
        // The data we want to POST is stored here
        //console.dir($scope.pin);
        
        $("#button-add").addClass('addbtn-info');
        $("#button-add").text("Adding Pin...")
        
        var req = { //Our POST request
            method: "POST",
            url: "/addpin",
            data: $scope.pin
        };
        
        $http(req).then(function(res) {
            console.log("Request successful...");
            $("#button-add").text("Added!");
            setTimeout(function() { document.location.hash = "recent"; }, 2000);
        }, function(res) {
            console.log("%c Request failed", "color:red font-size:18px");
            console.dir(res);
        });
        
    };
    
    //RegEx for valid image URL
    $scope.UrlImg = /^https?:\/\/[\w./-]+\/[\w./-]+\.(bmp|png|jpg|jpeg|gif)$/;
    
    //Remember we are in the newPin controller already...
    $scope.$on('$stateChangeSuccess', function() { 
        console.log("%c At newpin!", "color:blue; font-size:20px");
        console.log("$http is typeof " + (typeof $http));
        //Bring the focus to the Pin Title, as that is the first element in the form...
        $("#field-title").focus();
    });
    
    /**
     * Checks to see if an IMG tag needs to be added or the form's image URL field is different from the preview IMG's src ...
     */
    var updatePreview = function() {
        //If the placeholder text or an image is there...
        if ($("#image-placeholder")[0].children.length > 0) {
            if ($("#image-placeholder")[0].children[0].tagName == "IMG" && $("#addNewForm input[name=url]")[0].value == $("#image-placeholder")[0].children[0].tagName.src) {
                console.log("It's the same image, do nothing!");
            }
            else {
                $("#image-placeholder > *").fadeOut(1000).remove();
            }
        }
        
        //Create, append (as hidden), and fade in
        var img = document.createElement("img");
        console.log("adding onerror");
        //We are wrapping it in a function() because otherwise we'd be calling that function and setting its value to the onerror property
        img.onerror = function() { imgErrHandler(img) };
        //img.addEventListener("error", imgErrHandler(img));
        img.src = $("#addNewForm input[name=url]")[0].value;
        $(img).hide().appendTo("#image-placeholder").fadeIn(1000);        
    };
    
    var imgErrHandler = function(img) {
        console.log("Image Error handler called...");
        //Add code to check for naturalWidth...
        img.onerror = ""; //Prevent recursion...
        img.src = "/images/brokenimg.png";
        img.width = 100;
        img.height = 100;
        //console.dir(img);
    }
    
    $("#button-add").click(function() {
        console.log("you clicked me!");
    });
    
    
    //Use $("#image-placeholder img")[0].naturalHeight for broken image detection...
    
    //Note, this function only gets called when ng-change detects an ng-valid change
    $scope.urlCheck = function() {
        console.log("At urlCheck");
        updatePreview();
    }
    
});

ngApp.controller('recent', function($scope, $compile, $http) {
    $scope.$on('$stateChangeSuccess', function() { 
        console.log("%c At recent pins!", "color:orange; font-size:20px");
        if (typeof $http !== "function") {
            console.error("%cExpecting $http to be type of function.  $http currently is " + typeof $http, "background-color:black; color: red; font-size:18px");
        }
        if ($("#li-sign-out").data("username") == undefined) {
            console.log("%cMade it here!", "font-size:20px");
            sessionStorage.setItem("preLoginPage", document.location.hash);
        }
        console.log("$http is typeof " + (typeof $http));
        console.log("Loading recent pins...");
        
        var htconfig = {
            method: "GET",
            url: "/rpdata"
        };
        
        var gridInit = function() {
            $(".grid").masonry({
                itemSelector: '.grid-item',
                columnWidth: 0
            });
        }
        
        var imgRelisten = function() {
            $("#recent-div").imagesLoaded()
                .always(function(instance) {
                    gridInit();
                });
        };
        
        $http(htconfig).
            then(function(response) {
                window.dbgResponse = response;
                console.log("At .then\n Removing loading banner...");
                $("#loading-div").slideUp();
                for (var i=0; i < response.data.length; i++) {
                    var pin = $('<div class="grid-item"></div>');
                    var img = document.createElement("img");
                    img.src = response.data[i].imgUrl;
                    pin.append(img);

                    var voteBtn = document.createElement("button");
                        voteBtn.className = "vote-button";
                        voteBtn.setAttribute("ng-click", "showAlert($event)")
                        var star = document.createElement("i");
                        star.className = "fa fa-star";
                        voteBtn.appendChild(star);
                        var starCount = document.createElement("span");
                        starCount.className = "star-count";
                        starCount.textContent = response.data[i].likes.length;
                        voteBtn.appendChild(starCount);
                    pin.append(voteBtn);
                    console.log("Finished appending voteBtn... here is is...");
                    console.dir(voteBtn);
                    $compile(voteBtn)($scope);
                    
                    if ($("#li-sign-out").data("username") == response.data[i].pinOwner[0].userName) {
                        var deleteBtn = document.createElement("button");
                        deleteBtn.className = "delete-button";
                        deleteBtn.title = "Delete this Pin";
                        var deleteIcon = document.createElement("i");
                        deleteIcon.className = "fa fa-remove";
                        deleteBtn.appendChild(deleteIcon);
                        deleteBtn.setAttribute("ng-click", "foo($event)");
                        pin.append(deleteBtn);
                        $compile(deleteBtn)($scope);
                    }
                    
                    var title = response.data[i].title;
                    var titleDiv = document.createElement("div");
                    titleDiv.className = "pin-title";
                    titleDiv.textContent = title;
                    pin.append(titleDiv);
                    
                    var pinInfo = document.createElement("div");
                    pinInfo.className = "pin-info";
                    pinInfo.textContent = response.data[i].pinOwner[0].userName;
                    pin.append(pinInfo);
                    pin[0].setAttribute("data-pin-id", response.data[i]._id);
                    $("#recent-div").append(pin);
                }
                console.dir(response);
                window.globalResp = response;
                console.log("Waiting for images to load...");
                var triggerRelisten = false; //This will get set to true if any image is found broken and we need to wait for its replacement to finish loading
                $("#recent-div").imagesLoaded()
                    .always(function(instance) {
                        console.log("All immages loaded!");
                        //globalInst = instance;
                        if (instance.hasAnyBroken === true) {
                            console.log("%c There are broken images!", "font-color: red; font-size:12px;");
                            for (var i=0; i < instance.images.length; i++) {
                                if (!instance.images[i].isLoaded) {
                                    instance.images[i].img.src = "/images/brokenImg.png";
                                    triggerRelisten = true;
                                }
                            }
                            if (triggerRelisten) {
                                imgRelisten();
                            }
                        }
                        //console.dir(instance);
                        $(".grid").masonry({
                            itemSelector: '.grid-item',
                            columnWidth: 0
                        });
                    });
                //
                
            }, function(response) {
                console.log("At failed...");
                if (typeof $("#loading-div")[0] !== "undefined") {
                    $("#loading-div").text("Error loading data...");
                    $("#loading-div").addClass("bg-danger");
                }
            })
        
        
        
    });
    
    $scope.showAlert = function(evntVar) {
            console.dir(evntVar)
        }
    
    $scope.foo = function(evntVar) {
        var pinId = evntVar.currentTarget.parentNode.dataset.pinId;
        $http({
            method: "POST",
            data: {pinId: pinId},
            url: "/deletePin"
        }).then(function(response) {
            console.dir(response);
            window.dbgResp2 = response;
            if (response.data.result == "fail" && typeof response.data.error == "string") {
                window.alert("There was an error while trying to remove Pin: " + response.data.error);
            }
            if (response.data.result == "success") {
                $('[data-pin-id="' + pinId +'"]').effect({
                    effect: "explode",
                    duration: 2000,
                    complete: function() {
                        $(this).remove();
                        $(".grid").masonry({
                            itemSelector: '.grid-item',
                            columnWidth: 0
                        });
                    }   
                });
            }
        })
    }
    
});

$(function() { //Document ready
    
    console.log("%cDocument ready", "color:green;");
    if (typeof angular === "undefined") {
        console.group('%cAngular is not loaded', "color:red; font-size: 16px;");
        console.log("This app requires Angular to run correctly.")
        console.groupEnd();
    }
    
    //Also works when an elements acceskey is used (instead of click)
    $(".navbar-nav>li>a").click(function(event) {
        if (event.clientX == 0 && event.clientY == 0) { //Keyboard was used instead of mouse (as clientX & Y is the mouse's position)
            //console.dir(event);
            $(event.target.parentElement).addClass("navKbSelect");
            $(event.target.parentElement).one("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend", function(event) {
                //console.log("Animation ended...");
                //console.dir(event);
                $(event.target).removeClass("navKbSelect");
            });     
        }
    });
    
    $(".delete-button").click(function() {
       console.log("OW!!!!"); 
    });
    
});
