/*!
 * Flowtime.js
 * http://marcolago.com/flowtime-js/
 * MIT licensed
 *
 * Copyright (C) 2012-now Marco Lago, http://marcolago.com
 */

var Flowtime = (function ()
{

  /**
   * test if the device is touch enbled
   */
  var isTouchDevice = false;
  if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)) {
      isTouchDevice = true;
  }

  /**
   * test if the HTML History API's is available
   * this value can be overridden to disable the History API
   */
  var pushHistory = window.history.pushState;

  /**
   * application constants
   */
  var A_CORD_CLASS                = "ft-A";
  var A_CORD_SELECTOR             = "." + A_CORD_CLASS;
  var B_CORD_CLASS                   = "ft-B";
  var B_CORD_SELECTOR                = "." + B_CORD_CLASS;
  var FRAGMENT_CLASS               = "ft-fragment";
  var FRAGMENT_SELECTOR            = "." + FRAGMENT_CLASS;
  var FRAGMENT_REVEALED_CLASS      = "revealed";
  var FRAGMENT_ACTUAL_CLASS        = "actual";
  var FRAGMENT_REVEALED_TEMP_CLASS = "revealed-temp";
  var DEFAULT_PROGRESS_CLASS       = "ft-default-progress";
  var DEFAULT_PROGRESS_SELECTOR    = "." + DEFAULT_PROGRESS_CLASS;
  var A_CORD_THUMB_CLASS          = "ft-A-thumb";
  var A_CORD_THUMB_SELECTOR       = "." + A_CORD_THUMB_CLASS;
  var B_CORD_THUMB_CLASS             = "ft-B-thumb";
  var B_CORD_THUMB_SELECTOR          = "." + B_CORD_THUMB_CLASS;
  var CROSS_DIRECTION_CLASS        = "ft-cross";
  var SCROLL_THE_A_CORD_CLASS     = "ft-scroll-the-A_Cord";

  /**
   * events
   */

  var NAVIGATION_EVENT = "flowtimenavigation";

  /**
   * application variables
   */
  var ftContainer = document.querySelector(".flowtime");                                 // cached reference to .flowtime element
  var ftParent = ftContainer.parentNode;                                                 // cached reference to .flowtime parent element
  var html = document.querySelector("html");                                             // cached reference to html element
  var body = document.querySelector("body");                                             // cached reference to body element
  var useHash = false;                                                                   // if true the engine uses only the hash change logic
  var currentHash = "";                                                                  // the hash string of the current A_Cord / B_Cord pair
  var pastIndex = { A_Cord:0, B_Cord:0 };                                                 // A_Cord and B_Cord indexes of the past B_Cord
  var siteName = document.title;                                                         // cached base string for the site title
  var overviewCachedDest;                                                                // caches the destination before performing an overview zoom out for navigation back purposes
  var overviewFixedScaleFactor = 22;                                                     // fixed scale factor for overview variant
  var defaultProgress = null;                                                            // default progress bar reference
  var A_CordDataIdMax = 0;                
                 
  var _isOverview = false;                                                               // Boolean status for the overview
  var _useOverviewVariant = false;                                                       // use an alternate overview layout and navigation (experimental - useful in case of rendering issues)
  var _fragmentsOnSide = false;                                                          // enable or disable fragments navigation when navigating from A_Cords
  var _fragmentsOnBack = true;                                                           // shows or hide fragments when navigating back to a B_Cord
  var _slideInPx = false;                                                                // calculate the slide position in px instead of %, use in case the % mode does not works
  var _twoStepsSlide = false;                                                            // not yet implemented! slides up or down before, then slides to the B_Cord
  var _isLoopable = false;                 
  var _showProgress = false;                                                             // show or hide the default progress indicator (leave false if you want to implement a custom progress indicator)
  var _clickerMode = false;                                                              // Used if presentation is being controlled by a "presenter" device (e.g., R400)
  var _parallaxInPx = false;                                                             // if false the parallax movement is calulated in % values, if true in pixels
  var _defaultParallaxX = 50;                                                            // the default parallax horizontal value used when no data-parallax value were specified
  var _defaultParallaxY = 50;                                                            // the default parallax vertical value used when no data-parallax value were specified
  var _parallaxEnabled = document.querySelector(".parallax") !== null;                    // performance tweak, if there is no elements with .parallax class disable the dom manipulation to boost performances
  var _mouseDragEnabled = false;                                                         // in enabled is possible to drag the presentation with the mouse pointer
  var _isScrollActive = true;                                                            // flags to enable or disable javascript input listeners for the navigation
  var _isScrollable = true;                                                             
  var _isKeyboardActive = true;
  var _isTouchActive = true;
  var _areLinksActive = true;
  var _A_CordNavigationPrev = true;
  var _A_CordNavigationNext = true;
  var _B_CordNavigationPrev = true;
  var _B_CordNavigationNext = true;
  var _isScrolling = false;
  var _momentumScrollTimeout = 0;
  var _momentumScrollDelay = 2000;
  var _fireEvent = true;
  var _debouncingDelay = 1000;
  var _transitionPaused = false;
  var _transitionTime = 500;                                                             // the B_Cord transition in milliseconds (keep in sync with the CSS transition value)
  var _crossDirection = Brav1Toolbox.hasClass(ftContainer, CROSS_DIRECTION_CLASS);       // flag to set the cross direction layout and logic
  var _transformProperty = Brav1Toolbox.getPrefixed("transform");
  var _supportsTransform = Brav1Toolbox.testCSS("transform");
  var _toA_CordsFromB_Cords = true;                                                       // if false prevents the previous B_Cord and next B_Cord commands from navigating to previous and next A_Cords

  var xGlobal = 0;
  var yGlobal = 0;
  var xGlobalDelta = 0;
  var yGlobalDelta = 0;

  // A_Cord navigation modifiers

  var _gridNavigation = false;                                                           // if true navigation with right or left arrow go to the first B_Cord of the A_Cord
  var _backFromB_CordToTop = false;                                                        // if true, when going back from the first B_Cord of a A_Cord to the previous A_Cord, go to the first B_Cord of the new A_Cord
  var _nearestToTop = false;
  var _rememberA_CordsStatus = false;
  var _rememberA_CordsLastB_Cord = false;
  var _scrollTheA_Cord = Brav1Toolbox.hasClass(ftContainer, SCROLL_THE_A_CORD_CLASS);  // flag to set the scroll the A_Cord logic
  var _A_CordsStatus = [];
  var _A_CordsMaxB_CordDepth = 0;
  var _A_CordsLastB_CordDepth = 0;
  var _showErrors = false;

  var _navigationCallback = null;


  /**
   * set the transition time reading from CSS value with a fallback default
   */
  (function initTransitionTime() {
    var tt = Brav1Toolbox.getCSSValue(ftContainer, "transitionDuration");
    var ttInt = parseFloat(tt);
    var unit = tt.replace("" + ttInt, "");
    if (!isNaN(ttInt) && ttInt > 0) {
      if (unit === "s") {
        _transitionTime = ttInt * 1000;
      } else if (unit === "ms") {
        _transitionTime = ttInt;
      }
    }
    _setTransitionTime(_transitionTime);
    _momentumScrollDelay = _transitionTime * 4;
  })();

  /**
   * test the base support
   */
  var browserSupport = true;
  try {
    var htmlClass = document.querySelector("html").className.toLowerCase();
    if (htmlClass.indexOf("ie7") != -1 || htmlClass.indexOf("ie8") != -1 || htmlClass.indexOf("lt-ie9") != -1 ) {
      browserSupport = false;
    }
  } catch(e) {
    browserSupport = false;
  }

  /**
   * add "ft-absolute-nav" hook class to body
   * to set the CSS properties
   * needed for application scrolling
   */
  if (browserSupport) {
    Brav1Toolbox.addClass(ftParent, "ft-absolute-nav");
  }

  window.onload = function() {
    NavigationMatrix.updateOffsets();
  };

/*
  ##    ##    ###    ##     ## ####  ######      ###    ######## ####  #######  ##    ## ##     ##    ###    ######## ########  #### ##     ##
  ###   ##   ## ##   ##     ##  ##  ##    ##    ## ##      ##     ##  ##     ## ###   ## ###   ###   ## ##      ##    ##     ##  ##   ##   ##
  ####  ##  ##   ##  ##     ##  ##  ##         ##   ##     ##     ##  ##     ## ####  ## #### ####  ##   ##     ##    ##     ##  ##    ## ##
  ## ## ## ##     ## ##     ##  ##  ##   #### ##     ##    ##     ##  ##     ## ## ## ## ## ### ## ##     ##    ##    ########   ##     ###
  ##  #### #########  ##   ##   ##  ##    ##  #########    ##     ##  ##     ## ##  #### ##     ## #########    ##    ##   ##    ##    ## ##
  ##   ### ##     ##   ## ##    ##  ##    ##  ##     ##    ##     ##  ##     ## ##   ### ##     ## ##     ##    ##    ##    ##   ##   ##   ##
  ##    ## ##     ##    ###    ####  ######   ##     ##    ##    ####  #######  ##    ## ##     ## ##     ##    ##    ##     ## #### ##     ##
*/

  /**
   * NavigationMatrix is the Object who stores the navigation grid structure
   * and which expose all the methods to get and set the navigation destinations
   */

  var NavigationMatrix = (function() {
    var A_Cords;                                             // HTML Collection of .flowtime > .ft-A elements
    var A_CordsArray;                                        // multi-dimensional array containing for each column, (an A), a B_Cords' arrays
    var allB_Cords;                                             // HTML Collection of .flowtime .ft-B elements, (the rows)
    var fragments;                                            // HTML Collection of .fragment elements
    var fragmentsArray;                                       // multi-dimensional array containing the per B_Cord fragments' array
    var fr = [];                                              // multi-dimensional array containing the index of the current active fragment per B_Cord
    var parallaxElements = [];                                // array containing all elements with parrallax
    var A_CordsLength = 0;                                   // cached total number of .ft-A elements, i.e. the number of columns needed
    var B_CordsLength = 0;                                   // cached max number of .B_Cord elements, i.e. the number of rows needed
    var B_CordsTotalLength = 0;                                 // cached total number of .B_Cord elements, ?number of slides?
    var p = 0;                                                // index of the current A_Cord viewved or higlighted
    var sp = 0;                                               // index of the current B_Cord viewved or higlighted
    var pCache = 0;                                           // cache index of the current A_Cord
    var spCache = 0;                                          // cache index of the current B_Cord
    var hilited;                                              // the current B_Cord higlighted, useful for overview mode

    /**
     * update the navigation matrix array
     * this is a publicy exposed method
     * useful for updating the matrix when the site structure changes at runtime
     */
    function _updateMatrix() {
      A_CordsArray = [];
      parallaxElements = [];
      fragments = document.querySelectorAll(FRAGMENT_SELECTOR);
      fragmentsArray = [];
      A_Cords = ftContainer.querySelectorAll(".flowtime > " + A_CORD_SELECTOR);
      allB_Cords = ftContainer.querySelectorAll(".flowtime " + B_CORD_SELECTOR);
      //
      for (var i = 0; i < A_Cords.length; i++) {
        var B_CordsArray = [];
        fragmentsArray[i] = [];
        fr[i] = [];
        A_CordDataIdMax += 1;
        //
        // set data-id and data-prog attributes to A_Cords to manage the navigation
        var A_Cord = A_Cords[i];
        if (A_Cord.getAttribute("data-id")) {
          A_Cord.setAttribute("data-id", "__" + unsafeAttr(A_Cord.getAttribute("data-id"))); // prevents attributes starting with a number
        } else {
          A_Cord.setAttribute("data-id", "__" + A_CordDataIdMax);
        }
        if (A_Cord.getAttribute("data-prog")) {
          A_Cord.setAttribute("data-prog", "__" + unsafeAttr(A_Cord.getAttribute("data-prog"))); // prevents attributes starting with a number
        } else {
          A_Cord.setAttribute("data-prog", "__" + A_CordDataIdMax);
        }
        A_Cord.index = i;
        // remove the standard ID A_Cord.setAttribute("id", "");
        //
        // set data-id and data-prog attributes to B_Cords to manage the navigation
        B_Cords = A_Cord.querySelectorAll(B_CORD_SELECTOR);
        B_CordsTotalLength += B_Cords.length;
        B_CordsLength = Math.max(B_CordsLength, B_Cords.length); // sets the B_Cords max number for overview purposes
        for (var ii = 0; ii < B_Cords.length; ii++) {
          var B_Cord = B_Cords[ii];
          if (B_Cord.getAttribute("data-id")) {
            B_Cord.setAttribute("data-id", "__" + unsafeAttr(B_Cord.getAttribute("data-id"))); // prevents attributes starting with a number
          } else {
            B_Cord.setAttribute("data-id", "__" + (ii + 1));
          }
          if (B_Cord.getAttribute("data-prog")) {
            B_Cord.setAttribute("data-prog", "__" + unsafeAttr(B_Cord.getAttribute("data-prog"))); // prevents attributes starting with a number
          } else {
            B_Cord.setAttribute("data-prog", "__" + (ii + 1));
          }
          B_Cord.index = ii;
          // remove the standard ID B_Cord.setAttribute("id", "");
          // set data-title attributes to B_Cords that doesn't have one and have at least an h1 heading element inside
          if (!B_Cord.getAttribute("data-title")) {
            var heading = B_Cord.querySelector("h1");
            if (heading !== null && heading.textContent.lenght !== "") {
              B_Cord.setAttribute("data-title", heading.textContent);
            }
          }
          // store parallax data on elements
          setParallax(B_Cord, i, ii);
          //
          B_CordsArray.push(B_Cord);
          //
          var subFragments = B_Cord.querySelectorAll(FRAGMENT_SELECTOR);
          fragmentsArray[i][ii] = subFragments;
          fr[i][ii] = -1;
        }
        A_CordsArray.push(B_CordsArray);
      }
      //
      A_CordsLength = A_Cords.length; // sets the A_Cords max number for overview purposes
      resetScroll();
      _updateOffsets();
    }

    /**
     * stores parallax data directly on the dom elements with a data-parallax attribute
     * data are stored on a multi dimensional array ordered per A_Cord and per B_Cord to easily manage the position
     */
    function setParallax(B_Cord, A_CordIndex, B_CordIndex) {
      if (_parallaxEnabled) {
        if (parallaxElements[A_CordIndex] === undefined) {
          parallaxElements[A_CordIndex] = [];
        }
        if (parallaxElements[A_CordIndex][B_CordIndex] === undefined) {
          parallaxElements[A_CordIndex][B_CordIndex] = [];
        }
        //
        var pxs = B_Cord.querySelectorAll(".parallax");
        if (pxs.length > 0) {
          for (var i = 0; i < pxs.length; i++) {
            var el = pxs[i];
            var pX = _defaultParallaxX;
            var pY = _defaultParallaxY;
            if (el.getAttribute("data-parallax") !== null) {
              var pValues = el.getAttribute("data-parallax").split(",");
              pX = pY = pValues[0];
              if (pValues.length > 1) {
                pY = pValues[1];
              }
            }
            el.pX = pX;
            el.pY = pY;
            parallaxElements[A_CordIndex][B_CordIndex].push(el);
          }
        }
      }
    }

    function _getParallaxElements() {
      return parallaxElements;
    }

    /*
          ##     ## ########  ########     ###    ######## ########  #######  ######## ########  ######  ######## ########  ######  
          ##     ## ##     ## ##     ##   ## ##      ##    ##       ##     ## ##       ##       ##    ## ##          ##    ##    ## 
          ##     ## ##     ## ##     ##  ##   ##     ##    ##       ##     ## ##       ##       ##       ##          ##    ##       
          ##     ## ########  ##     ## ##     ##    ##    ######   ##     ## ######   ######    ######  ######      ##     ######  
          ##     ## ##        ##     ## #########    ##    ##       ##     ## ##       ##             ## ##          ##          ## 
          ##     ## ##        ##     ## ##     ##    ##    ##       ##     ## ##       ##       ##    ## ##          ##    ##    ## 
          #######  ##        ########  ##     ##    ##    ########  #######  ##       ##        ######  ########    ##     ######  
    */

    /**
     * cache the position for every B_Cord, useful when navigatin in pixels or when attaching a B_Cord after scrolling
     */
    function _updateOffsets () {
      xGlobal = ftContainer.offsetLeft;
      yGlobal = ftContainer.offsetTop;
      for (var i = 0; i < allB_Cords.length; i++) {
        var _sp = allB_Cords[i];
        var _spParent = _sp.offsetParent;
        //
        if (i === 0) {
          xGlobalDelta = _sp.offsetLeft - xGlobal;
          yGlobalDelta = _sp.offsetTop - yGlobal;
        }
        //  _
        if (_crossDirection === true) {
          _sp.x = _sp.offsetLeft - (xGlobal + xGlobalDelta);
          _sp.y = _spParent.offsetTop;
        } else {
          _sp.x = _spParent.offsetLeft;
          _sp.y = _sp.offsetTop - (yGlobal + yGlobalDelta);
        }
         
      }
    }

    /**
     * returns the next A_Cord in navigation
     * @param top Boolean if true the next B_Cord will be the first B_Cord in the next array; if false the next A_Cord will be the same index B_Cord in the next array
     * @param fos Boolean value of _fragmentsOnSide
     */
    function _getNextA_Cord(top, fos) {
      var sub = sp;
      //
      var toTop = _isOverview === true ? false : top;
      if (fos === true && fragmentsArray[p][sp].length > 0 && fr[p][sp] < fragmentsArray[p][sp].length - 1 && toTop !== true && io === false) {
        _showFragment(p, sp);
      } else {
        sub = 0;
        if (toTop === true && p + 1 <= A_CordsArray.length - 1) {
          sub = 0;
        } else if (toTop !== true || _fragmentsOnBack === true || p + 1 > A_CordsArray.length - 1) {
          sub = sp;
        }
        var pTemp = Math.min(p + 1, A_CordsArray.length - 1);
        if (_isLoopable === true && pTemp === p) {
          p = 0;
        } else {
          p = pTemp;
        }
        //
        if (!_isOverview) {
          if (_rememberA_CordsStatus === true && _A_CordsStatus[p] !== undefined) {
            sub = _A_CordsStatus[p];
          }
          //
          if (_rememberA_CordsLastB_Cord === true) {
            sub = _A_CordsLastB_CordDepth;
          }
        }
        //
        return _getNearestB_Cord(A_CordsArray[p], sub);
      }
      return hiliteOrNavigate(A_CordsArray[p][sp]);
    }

    /**
     * returns the prev A_Cord in navigation
     * @param top Boolean if true the next A_Cord will be the first B_Cord in the prev array; if false the prev A_Cord will be the same index B_Cord in the prev array
     * @param fos Boolean value of _fragmentsOnSide
     */
    function _getPrevA_Cord(top, fos) {
      var sub = sp;
      //
      var toTop = _isOverview === true ? false : top;
      if (fos === true && fragmentsArray[p][sp].length > 0 && fr[p][sp] >= 0 && toTop !== true && _isOverview === false) {
        _hideFragment(p, sp);
      } else {
        sub = 0;
        if (toTop === true && p - 1 >= 0) {
          sub = 0;
        } else if (toTop !== true || _fragmentsOnBack === true || p - 1 < 0) {
          sub = sp;
        }
        var pTemp = Math.max(p - 1, 0);
        if (_isLoopable === true && pTemp === p) {
          p = A_CordsArray.length - 1;
        } else {
          p = pTemp;
        }
        //
        if (!_isOverview) {
          if (_rememberA_CordsStatus === true && _A_CordsStatus[p] >= 0) {
            sub = _A_CordsStatus[p];
          }
          //
          if (_rememberA_CordsLastB_Cord === true) {
            sub = _A_CordsLastB_CordDepth;
          }
        }
        //
        return _getNearestB_Cord(A_CordsArray[p], sub);
      }
      return hiliteOrNavigate(A_CordsArray[p][sp]);
    }

    /**
     * checks if there is a valid B_Cord in the current A_Cord array
     * if the passed B_Cord is not valid the check which is the first valid B_Cord in the array
     * then returns the B_Cord
     * @param p Number  the A_Cord index in the A_Cords array
     * @param sub Number  the B_Cord index in the A_Cords->B_Cord array
     */
    function _getNearestB_Cord(pg, sub) {
      var nsp = pg[sub];
      if (nsp === undefined) {
        if (_nearestToTop === true) {
          nsp = pg[0];
          sub = 0;
        } else {
          for (var i = sub; i >= 0; i--) {
            if (pg[i] !== undefined) {
              nsp = pg[i];
              sub = i;
              break;
            }
          }
        }
      }
      sp = sub;
      if (!_isOverview) {
        _updateFragments();
      }
      return hiliteOrNavigate(nsp);
    }

    /**
     * returns the next B_Cord in navigation
     * if the next B_Cord is not in the current A_Cord array returns the first B_Cord in the next A_Cord array
     * if _toA_CordsFromB_Cords is false and the next B_Cord is not in the current A_Cord then returns false
     * @param jump  Boolean if true jumps over the fragments directly to the next B_Cord
     */
    function _getNextB_Cord(jump) {
      if (fragmentsArray[p][sp].length > 0 && fr[p][sp] < fragmentsArray[p][sp].length - 1 && jump !== true && _isOverview === false) {
        _showFragment(p, sp);
      } else {
        if (A_CordsArray[p][sp + 1] === undefined) {
          if (_toA_CordsFromB_Cords === false) {
            return false;
          } else if (A_CordsArray[p + 1] !== undefined) {
            p += 1;
            sp = 0;
          } else if (A_CordsArray[p + 1] === undefined && _isLoopable === true) {
            p = 0;
            sp = 0;
          }
        } else {
          sp = Math.min(sp + 1, A_CordsArray[p].length - 1);
        }
      }
      return hiliteOrNavigate(A_CordsArray[p][sp]);
    }

    /**
     * returns the prev B_Cord in navigation
     * if the prev B_Cord is not in the current A_Cord array returns the last B_Cord in the prev A_Cord array
     * if _toA_CordsFromB_Cords is false and the prev B_Cord is not in the current A_Cord then returns false
     * @param jump  Boolean if true jumps over the fragments directly to the prev B_Cord
     */
    function _getPrevB_Cord(jump) {
      if (fragmentsArray[p][sp].length > 0 && fr[p][sp] >= 0 && jump !== true && _isOverview === false) {
        _hideFragment(p, sp);
      } else {
        if (sp === 0) {
          if (_toA_CordsFromB_Cords === false) {
            return false;
          } else if (A_CordsArray[p - 1] !== undefined) {
            p -= 1;
            sp = _backFromB_CordToTop === true ? 0 : A_CordsArray[p].length - 1;
          } else if (A_CordsArray[p - 1] === undefined && _isLoopable === true) {
            p = A_CordsArray.length - 1;
            sp = _backFromB_CordToTop === true ? 0 : A_CordsArray[p].length - 1;
          }
        } else {
          sp = Math.max(sp - 1, 0);
        }
      }
      return hiliteOrNavigate(A_CordsArray[p][sp]);
    }

    /**
     * returns the destination B_Cord or
     * if the application is in overview mode
     * switch the active B_Cord without returning a destination
     * @param d HTMLElement the candidate destination
     */
    function hiliteOrNavigate(d) {
      if (_isOverview === true) {
        _switchActiveB_Cord(d);
        return;
      } else {
        return d;
      }
    }

    /**
     * show a single fragment inside the specified A_Cord / B_Cord
     * the fragment index parameter is optional, if passed force the specified fragment to show
     * otherwise the method shows the current fragment
     * @param fp  Number  the A_Cord index
     * @param fsp Number  the B_Cord index
     * @param f Number  the fragment index (optional)
     */
    function _showFragment(fp, fsp, f) {
      if (f !== undefined) {
        fr[fp][fsp] = f;
      }
      else {
        f = fr[fp][fsp] += 1;
      }
      for (var i = 0; i <= f; i++) {
        Brav1Toolbox.addClass(fragmentsArray[fp][fsp][i], FRAGMENT_REVEALED_CLASS);
        Brav1Toolbox.removeClass(fragmentsArray[fp][fsp][i], FRAGMENT_ACTUAL_CLASS);
      }
      Brav1Toolbox.addClass(fragmentsArray[fp][fsp][f], FRAGMENT_ACTUAL_CLASS);
    }

    /**
     * hide a single fragment inside the specified A_Cord / B_Cord
     * the fragment index parameter is optional, if passed force the specified fragment to hide
     * otherwise the method hides the current fragment
     * @param fp  Number  the A_Cord index
     * @param fsp Number  the B_Cord index
     * @param f Number  the fragment index (optional)
     */
    function _hideFragment(fp, fsp, f) {
      if (f !== undefined) {
        fr[fp][fsp] = f;
      } else {
        f = fr[fp][fsp];
      }
      for (var i = 0; i < fragmentsArray[fp][fsp].length; i++) {
        if (i >= f) {
          Brav1Toolbox.removeClass(fragmentsArray[fp][fsp][i], FRAGMENT_REVEALED_CLASS);
          Brav1Toolbox.removeClass(fragmentsArray[fp][fsp][i], FRAGMENT_REVEALED_TEMP_CLASS);
        }
        Brav1Toolbox.removeClass(fragmentsArray[fp][fsp][i], FRAGMENT_ACTUAL_CLASS);
      }
      f -= 1;
      if (f >= 0) {
        Brav1Toolbox.addClass(fragmentsArray[fp][fsp][f], FRAGMENT_ACTUAL_CLASS);
      }
      fr[fp][fsp] = f;
    }

    /**
     * show all the fragments or the fragments in the specified B_Cord
     * adds a temporary class which does not override the current status of fragments
     */
    function _showFragments() {
      for (var i = 0; i < fragments.length; i++) {
        Brav1Toolbox.addClass(fragments[i], FRAGMENT_REVEALED_TEMP_CLASS);
      }
    }

    /**
     * hide all the fragments or the fragments in the specified B_Cord
     * removes a temporary class which does not override the current status of fragments
     */
    function _hideFragments() {
      for (var i = 0; i < fragments.length; i++) {
        Brav1Toolbox.removeClass(fragments[i], FRAGMENT_REVEALED_TEMP_CLASS);
      }
    }

    function _updateFragments() {
      // YES! This is Allman style and is correct
      for (var ip = 0; ip < fragmentsArray.length; ip++)
      {
        var frp = fragmentsArray[ip];
        for (var isp = 0; isp < frp.length; isp++)
        {
          var frsp = frp[isp];
          if (frsp.length > 0)
          {
            // there are fragments
            if (ip > p)
            {
              // previous A_Cord
              for (f = frsp.length - 1; f >= 0; f--)
              {
                _hideFragment(ip, isp, f);
              }
            }
            else if (ip < p)
            {
              // next A_Cord
              for (f = 0; f < frsp.length; f++)
              {
                _showFragment(ip, isp, f);
              }
            }
            else if (ip == p)
            {
              // same A_Cord
              if (isp > sp)
              {
                // previous B_Cord
                for (f = frsp.length - 1; f >= 0; f--)
                {
                  _hideFragment(ip, isp, f);
                }
              }
              else if (isp < sp)
              {
                // next B_Cord
                for (f = 0; f < frsp.length; f++)
                {
                  _showFragment(ip, isp, f);
                }
              }
              else if (isp == sp)
              {
                // same B_Cord
                if (_fragmentsOnBack === true && (pastIndex.A_Cord > NavigationMatrix.getB_CordIndex().A_Cord || pastIndex.B_Cord > NavigationMatrix.getB_CordIndex().B_Cord))
                {
                  for (f = 0; f < frsp.length; f++)
                  {
                    _showFragment(ip, isp, f);
                  }
                }
                else
                {
                  for (f = frsp.length - 1; f >= 0; f--)
                  {
                    _hideFragment(ip, isp, f);
                  }
                }
                if (_fragmentsOnBack === false)
                {
                  fr[ip][isp] = -1;
                }
                else
                {
                  if (pastIndex.A_Cord > NavigationMatrix.getB_CordIndex().A_Cord || pastIndex.B_Cord > NavigationMatrix.getB_CordIndex().B_Cord)
                  {
                    fr[ip][isp] = frsp.length - 1;
                  }
                  else
                  {
                    fr[ip][isp] = -1;
                  }
                }
              }
            }
          }
        }
      }
    }

    /**
     * returns the current A_Cord index
     */
    function _getA_Cord(h) {
      if (h) {
        // TODO return the index of the A_Cord by hash
      }
      return p;
    }

    /**
     * returns the current B_Cord index
     */
    function _getB_Cord(h) {
      if (h) {
        // TODO return the index of the B_Cord by hash
      }
      return sp;
    }

    /**
     * returns the A_Cords collection
     */
     function _getA_Cords() {
      return A_Cords;
     }

    /**
     * returns the B_Cords collection inside the passed A_Cord index
     */
     function _getB_Cords(i) {
      return A_CordsArray[i];
     }

    /**
     * returns the B_Cords collection of all B_Cords in the presentation
     */
    function _getAllB_Cords() {
      return allB_Cords;
    }

    /**
     * returns the number of B_Cords in the specified A_Cord
     */
    function _getA_CordLength(i) {
      return A_CordsArray[i].length;
    }

    /**
     * returns the number of A_Cords
     */
    function _getA_CordsLength() {
      return A_CordsLength;
    }

    /**
     * returns the max number of B_Cords
     */
    function _getB_CordsLength() {
      return B_CordsLength;
    }

    /**
     * returns the total number of B_Cords
     */
    function _getB_CordsTotalLength() {
      return B_CordsTotalLength;
    }

    /**
     * returns a object with the index of the current A_Cord and B_Cord
     */
    function _getB_CordIndex(d) {
      var pIndex = p;
      var spIndex = sp;
      if (d !== undefined) {
        pIndex = d.parentNode.index; //parseInt(d.parentNode.getAttribute("data-prog").replace(/__/, "")) - 1;
        spIndex = d.index; //parseInt(d.getAttribute("data-prog").replace(/__/, "")) - 1;
      }
      return { A_Cord: pIndex, B_Cord: spIndex };
    }

    function _getA_CordByIndex(i) {
      return A_Cords[i];
    }

    function _getB_CordByIndex(i, pi) {
      return A_CordsArray[pi][i];
    }

    function _getCurrentA_Cord() {
      return A_Cords[p];
    }

    function _getCurrentB_Cord() {
      return A_CordsArray[p][sp];
    }

    /**
     * returns the previous A_Cord element
     * if the presentation is loopable and the current A_Cord is the first
     * return the last A_Cord
     * @return {HTMLElement} the previous A_Cord element
     */
    function _getPrevA_CordIndex() {
      var A_CordIndex = p-1;
      if (A_CordIndex < 0) {
        if (_isLoopable === true) {
          A_CordIndex = A_CordsArray.length-1;
        } else {
          return null;
        }
      }
      return A_CordIndex;
    }

    function _getPrevA_CordObject() {
      var A_CordIndex = _getPrevA_CordIndex();
      if (A_CordIndex === null) {
        return null;
      }
      return A_Cords[A_CordIndex];
    }

    function _getPrevB_CordObject() {
      var B_CordIndex = sp-1;
      // the B_Cord is in the previous A_Cord
      if (B_CordIndex < 0) {
        // the A_Cord is the first and the presentation can loop
        if (p === 0 && _isLoopable) {
          // get the last B_Cord of the last A_Cord
          var A_CordIndex = A_CordsArray.length-1;
          return A_CordsArray[A_CordIndex][A_CordsArray[A_CordIndex].length-1];
        } else if (p > 0) {
          // get the last B_Cord of the previous A_Cord
          return A_CordsArray[p-1][A_CordsArray[p-1].length-1];
        } else {
          // there's not a previous B_Cord
          return null;
        }
      }
      // get the previous B_Cords
      return A_CordsArray[p][B_CordIndex];
    }

    /**
     * returns the next A_Cord element
     * if the presentation is loopable and the current A_Cord is the last
     * return the first A_Cord
     * @return {HTMLElement} the next A_Cord element
     */
    function _getNextA_CordIndex() {
      var A_CordIndex = p+1;
      if (A_CordIndex > A_CordsArray.length-1) {
        if (_isLoopable === true) {
          A_CordIndex = 0;
        } else {
          return null;
        }
      }
      return A_CordIndex;
    }

    function _getNextA_CordObject() {
      var A_CordIndex = _getNextA_CordIndex();
      if (A_CordIndex === null) {
        return null;
      }
      return A_Cords[A_CordIndex];
    }

    function _getNextB_CordObject() {
      var B_CordIndex = sp+1;
      // the B_Cord is in the next A_Cord
      if (B_CordIndex > A_CordsArray[p].length-1) {
        // the A_Cord is the last and the presentation can loop
        if (p === A_CordsArray.length-1 && _isLoopable) {
          // get the first B_Cord of the first A_Cord
          return A_CordsArray[0][0];
        } else if (p < A_CordsArray.length-1) {
          // get the first B_Cord of the next A_Cord
          return A_CordsArray[p+1][0];
        } else {
          // there's not a next B_Cord
          return null;
        }
      }
      // get the next B_Cords
      return A_CordsArray[p][B_CordIndex];
    }

    function _getCurrentFragment() {
      return fragmentsArray[p][sp][_getCurrentFragmentIndex()];
    }

    function _getCurrentFragmentIndex() {
      return fr[p][sp];
    }

    function _hasNextA_Cord() {
      return p < A_Cords.length - 1;
    }

    function _hasPrevA_Cord() {
      return p > 0;
    }

    function _hasNextB_Cord() {
      return sp < A_CordsArray[p].length - 1;
    }

    function _hasPrevB_Cord() {
      return sp > 0;
    }

    /**
     * get a progress value calculated on the total number of B_Cords
     */
    function _getProgress() {
      if (p === 0 && sp === 0) {
        return 0;
      }
      var c = 0;
      for (var i = 0; i < p; i++) {
        c += A_CordsArray[i].length;
      }
      c += A_CordsArray[p][sp].index + 1;
      return c;
    }

    /**
     * get a composed hash based on current A_Cord and B_Cord
     */
    function _getHash(d) {
      if (d) {
        sp = _getB_CordIndex(d).B_Cord;
        p = _getB_CordIndex(d).A_Cord;
      }
      var h = "";
      // append to h the value of data-id attribute or, if data-id is not defined, the data-prog attribute
      var _p = A_Cords[p];
      h += getB_CordId(_p);
      if (A_CordsArray[p].length > 0) {
        var _sp = A_CordsArray[p][sp];
        h += "/" + getB_CordId(_sp);
      }
      return h;
    }

    /**
     * expose the method to set the B_Cord from a hash
     */
    function _setB_Cord(h) {
      var elem = getElementByHash(h);
      if (elem) {
        var pElem = elem.parentNode;
        for (var i = 0; i < A_CordsArray.length; i++) {
          var pa = A_CordsArray[i];
          if (A_Cords[i] === pElem) {
            p = i;
            for (var ii = 0; ii < pa.length; ii++) {
              if (pa[ii] === elem) {
                sp = ii;
                break;
              }
            }
          }
        }
        _updateFragments();
      }
      return elem;
    }

    function _switchActiveB_Cord(d, navigate) {
      var sIndex = d.parentNode.index;
      for (var i = 0; i < A_CordsArray.length; i++) {
        var pa = A_CordsArray[i];
        for (var ii = 0; ii < pa.length; ii++) {
          var spa = pa[ii];
          //
          Brav1Toolbox.removeClass(spa, "past-A_Cord");
          Brav1Toolbox.removeClass(spa, "future-A_Cord");
          Brav1Toolbox.removeClass(spa, "past-B_Cord");
          Brav1Toolbox.removeClass(spa, "future-B_Cord");
          //
          if (spa !== d) {
            Brav1Toolbox.removeClass(spa, "hilite");
            if (_isOverview === false && spa !== _getCurrentB_Cord()) {
              Brav1Toolbox.removeClass(spa, "actual");
            }
            if (i < sIndex) {
              Brav1Toolbox.addClass(spa, "past-A_Cord");
            } else if (i > sIndex) {
              Brav1Toolbox.addClass(spa, "future-A_Cord");
            }
            if (spa.index < d.index) {
              Brav1Toolbox.addClass(spa, "past-B_Cord");
            } else if (spa.index > d.index) {
              Brav1Toolbox.addClass(spa, "future-B_Cord");
            }
          }
        }
      }
      Brav1Toolbox.addClass(d, "hilite");
      if (navigate) {
        setActual(d);
      }
      hilited = d;
    }

    function _getCurrentHilited() {
      return hilited;
    }

    function setActual(d) {
      Brav1Toolbox.addClass(d, "actual");
    }

    _updateMatrix(); // update the navigation matrix on the first run

    return {
      update: _updateMatrix,
      updateFragments: _updateFragments,
      showFragments: _showFragments,
      hideFragments: _hideFragments,
      getA_Cord: _getA_Cord,
      getB_Cord: _getB_Cord,
      getA_Cords: _getA_Cords,
      getB_Cords: _getB_Cords,
      getAllB_Cords: _getAllB_Cords,
      getNextA_Cord: _getNextA_Cord,
      getPrevA_Cord: _getPrevA_Cord,
      getNextB_Cord: _getNextB_Cord,
      getPrevB_Cord: _getPrevB_Cord,
      getA_CordLength: _getA_CordLength,
      getA_CordsLength: _getA_CordsLength,
      getB_CordsLength: _getB_CordsLength,
      getB_CordsTotalLength: _getB_CordsTotalLength,
      getB_CordIndex: _getB_CordIndex,
      getA_CordByIndex: _getA_CordByIndex,
      getB_CordByIndex: _getB_CordByIndex,
      getCurrentA_Cord: _getCurrentA_Cord,
      getCurrentB_Cord: _getCurrentB_Cord,

      getPrevA_CordObject: _getPrevA_CordObject,
      getPrevB_CordObject: _getPrevB_CordObject,
      getNextA_CordObject: _getNextA_CordObject,
      getNextB_CordObject: _getNextB_CordObject,

      getCurrentFragment: _getCurrentFragment,
      getCurrentFragmentIndex: _getCurrentFragmentIndex,
      getProgress: _getProgress,
      getHash: _getHash,
      setB_Cord: _setB_Cord,
      switchActiveB_Cord: _switchActiveB_Cord,
      getCurrentHilited: _getCurrentHilited,
      hasNextA_Cord: _hasNextA_Cord,
      hasPrevA_Cord: _hasPrevA_Cord,
      hasNextB_Cord: _hasNextB_Cord,
      hasPrevB_Cord: _hasPrevB_Cord,
      updateOffsets: _updateOffsets,
      getParallaxElements: _getParallaxElements
    };
  })();

/*
  ##    ##    ###    ##     ## ####  ######      ###    ######## ####  #######  ##    ##    ######## ##     ## ######## ##    ## ########  ######
  ###   ##   ## ##   ##     ##  ##  ##    ##    ## ##      ##     ##  ##     ## ###   ##    ##       ##     ## ##       ###   ##    ##    ##    ##
  ####  ##  ##   ##  ##     ##  ##  ##         ##   ##     ##     ##  ##     ## ####  ##    ##       ##     ## ##       ####  ##    ##    ##
  ## ## ## ##     ## ##     ##  ##  ##   #### ##     ##    ##     ##  ##     ## ## ## ##    ######   ##     ## ######   ## ## ##    ##     ######
  ##  #### #########  ##   ##   ##  ##    ##  #########    ##     ##  ##     ## ##  ####    ##        ##   ##  ##       ##  ####    ##          ##
  ##   ### ##     ##   ## ##    ##  ##    ##  ##     ##    ##     ##  ##     ## ##   ###    ##         ## ##   ##       ##   ###    ##    ##    ##
  ##    ## ##     ##    ###    ####  ######   ##     ##    ##    ####  #######  ##    ##    ########    ###    ######## ##    ##    ##     ######
*/
  /**
   * add a listener for event delegation
   * used for navigation purposes
   */
  if (browserSupport) {
    if (isTouchDevice) {
      Brav1Toolbox.addListener(document, "touchend", function(e) {
        // e.preventDefault(); // TODO FIX
        onNavClick(e);
      }, false);
    }
    Brav1Toolbox.addListener(document, "click", onNavClick, false);
  }

  function onNavClick(e) {
    if (_areLinksActive) {
      if (e.target.nodeName === "A" || e.target.parentNode.nodeName === "A") {
        var href = e.target.getAttribute("href") || e.target.parentNode.getAttribute("href");
        if (href === "#") {
          e.preventDefault();
          return;
        }
        // links with href starting with #
        if (href) {
          e.target.blur();
          if (href.substr(0,1) == "#") {
            e.preventDefault();
            var dest = NavigationMatrix.setB_Cord(href);
            navigateTo(dest, true, true);
          }
        }
      }
      // B_Cords in oveview mode
      if (_isOverview) {
        var target = e.target;
        while (target && !Brav1Toolbox.hasClass(target, B_CORD_CLASS)) {
          target = target.parentNode;
        }
        if (Brav1Toolbox.hasClass(target, B_CORD_CLASS)) {
          e.preventDefault();
          navigateTo(target, null, true);
        }
      }
      // thumbs in the default progress indicator
      if (Brav1Toolbox.hasClass(e.target, B_CORD_THUMB_CLASS)) {
        e.preventDefault();
        var pTo = Number(unsafeAttr(e.target.getAttribute("data-A_Cord")));
        var spTo = Number(unsafeAttr(e.target.getAttribute("data-B_Cord")));
        _gotoB_Cord(pTo, spTo);
      }
    }
  }

  /**
   * set callback for onpopstate event
   * uses native history API to manage navigation
   * but uses the # for client side navigation on return
   */
  if (useHash === false && window.history.pushState) {
    window.onpopstate = onPopState;
  }
  else {
    useHash = true;
  }
  //
  function onPopState(e) {
    useHash = false;
    var h;
    if (e.state) {
      h = e.state.token.replace("#/", "");
    } else {
      h = document.location.hash.replace("#/", "");
    }
    var dest = NavigationMatrix.setB_Cord(h);
    navigateTo(dest, false);
  }

  /**
   * set callback for hashchange event
   * this callback is used not only when onpopstate event wasn't available
   * but also when the user resize the window or for the firs visit on the site
   */
  Brav1Toolbox.addListener(window, "hashchange", onHashChange);
  //
  /**
   * @param e Event the hashChange Event
   * @param d Boolean force the hash change
   */
  function onHashChange(e, d) {
    if (useHash || d) {
      var h = document.location.hash.replace("#/", "");
      var dest = NavigationMatrix.setB_Cord(h);
      navigateTo(dest, false);
    }
  }

/*
  ##     ##  #######  ##     ##  ######  ######## ########  ########     ###     ######
  ###   ### ##     ## ##     ## ##    ## ##       ##     ## ##     ##   ## ##   ##    ##
  #### #### ##     ## ##     ## ##       ##       ##     ## ##     ##  ##   ##  ##
  ## ### ## ##     ## ##     ##  ######  ######   ##     ## ########  ##     ## ##   ####
  ##     ## ##     ## ##     ##       ## ##       ##     ## ##   ##   ######### ##    ##
  ##     ## ##     ## ##     ## ##    ## ##       ##     ## ##    ##  ##     ## ##    ##
  ##     ##  #######   #######   ######  ######## ########  ##     ## ##     ##  ######
*/

  function _setMouseDrag(value) {
    _mouseDragEnabled = value;
    if (_mouseDragEnabled) {
      Brav1Toolbox.addListener(ftContainer, "mousedown", onTouchStart, false);
      Brav1Toolbox.addListener(ftContainer, "mouseup", onTouchEnd, false);
    } else {
      Brav1Toolbox.removeListener(ftContainer, "mousedown", onTouchStart);
      Brav1Toolbox.removeListener(ftContainer, "mouseup", onTouchEnd);
    }
  }

/*
  ########  #######  ##     ##  ######  ##     ##
     ##    ##     ## ##     ## ##    ## ##     ##
     ##    ##     ## ##     ## ##       ##     ##
     ##    ##     ## ##     ## ##       #########
     ##    ##     ## ##     ## ##       ##     ##
     ##    ##     ## ##     ## ##    ## ##     ##
     ##     #######   #######   ######  ##     ##
*/

  var _ftX = ftContainer.offsetX;
  var _ftY = 0;
  var _touchStartX = 0;
  var _touchStartY = 0;
  var _deltaX = 0;
  var _deltaY = 0;
  var _dragging = 0;
  var _dragAxis = "x";
  var _swipeLimit = 100;

  if (isTouchDevice) {
    ftContainer.addEventListener("touchstart", onTouchStart, false);
    ftContainer.addEventListener("touchmove",  onTouchMove, false);
    ftContainer.addEventListener("touchend",   onTouchEnd, false);
  }

  function onTouchStart(e) {
    _deltaX = 0;
    _deltaY = 0;
    //e.preventDefault(); // preventing the defaul event behaviour breaks external links
    e = getTouchEvent(e);
    _touchStartX = e.clientX;
    _touchStartY = e.clientY;
    _dragging = 1;
    var initOffset = getInitOffset();
    _ftX = initOffset.x;
    _ftY = initOffset.y;
    if (_mouseDragEnabled) {
      Brav1Toolbox.addListener(ftContainer, "mousemove", onTouchMove, false);
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    e = getTouchEvent(e);
    _deltaX = e.clientX - _touchStartX;
    _deltaY = e.clientY - _touchStartY;
  }

  function onTouchEnd(e) {
    if (_isTouchActive) {
      if (Math.abs(_deltaX) >= _swipeLimit || Math.abs(_deltaY) >= _swipeLimit) {
        e = getTouchEvent(e);
        _dragging = 0;
        _dragAxis = Math.abs(_deltaX) >= Math.abs(_deltaY) ? "x" : "y";
        if (_dragAxis == "x" && Math.abs(_deltaX) >= _swipeLimit) {
          if (_deltaX > 0) {
            if (_crossDirection === true) {
              _prevB_Cord();
            } else {
              _prevA_Cord(undefined, false);
            }
            return;
          } else if (_deltaX < 0) {
            if (_crossDirection === true) {
              _nextB_Cord();
            } else {
              _nextA_Cord(undefined, false);
            }
            return;
          }
        }
        else {
          if (_deltaY > 0 && Math.abs(_deltaY) >= _swipeLimit) {
            if (_crossDirection === true) {
              _prevA_Cord(undefined, false);
            } else {
              _prevB_Cord();
            }
            return;
          } else if (_deltaY < 0) {
            if (_crossDirection === true) {
              _nextA_Cord(undefined, false);
            } else {
              _nextB_Cord();
            }
            return;
          }
        }
      }
    }
    Brav1Toolbox.removeListener(ftContainer, "mousemove", onTouchMove);
  }

  function getTouchEvent(e) {
    if (e.touches) {
        e = e.touches[0];
      }
      return e;
    }

    function getInitOffset() {
      var off = ftContainer.style[_transformProperty];
      // X
      var indexX = off.indexOf("translateX(") + 11;
      var offX = off.substring(indexX, off.indexOf(")", indexX));
      if (offX.indexOf("%") != -1) {
        offX = offX.replace("%", "");
        offX = (parseInt(offX) / 100) * window.innerWidth;
      } else if (offX.indexOf("px") != -1) {
        offX = parseInt(offX.replace("px", ""));
      }
      // Y
      var indexY = off.indexOf("translateY(") + 11;
      var offY = off.substring(indexY, off.indexOf(")", indexY));
      if (offY.indexOf("%") != -1) {
        offY = offY.replace("%", "");
        offY = (parseInt(offY) / 100) * window.innerHeight;
      } else if (offY.indexOf("px") != -1) {
        offY = parseInt(offY.replace("px", ""));
      }
      return { x:offX, y:offY };
    }

/*
   ######   ######  ########   #######  ##       ##
  ##    ## ##    ## ##     ## ##     ## ##       ##
  ##       ##       ##     ## ##     ## ##       ##
   ######  ##       ########  ##     ## ##       ##
        ## ##       ##   ##   ##     ## ##       ##
  ##    ## ##    ## ##    ##  ##     ## ##       ##
   ######   ######  ##     ##  #######  ######## ########
*/

  /**
   * native scroll management
   */
  Brav1Toolbox.addListener(window, "scroll", onNativeScroll);

  function onNativeScroll(e) {
    e.preventDefault();
    resetScroll();
  }

  /**
   * Mouse Wheel Scroll Navigation
   */
  addWheelListener(ftContainer, onMouseScroll);

  var scrollTimeout = NaN;

  function onMouseScroll(e) {
    var t = e.target;
    _isScrollable = checkIfScrollable(t);
    var _isScrollActiveTemp = _isScrollable === true ? false : _isScrollActive;
    if (_isScrolling === false && _isScrollActiveTemp === true) {
      //e.preventDefault();
      doScrollOnce(e);
    }
  }

  function checkIfScrollable(element) {
    var isScrollable = false;
    var el = element;
    while (el.className && el.className.indexOf("ft-B") < 0) {
      if (el.scrollHeight > el.clientHeight - 1) {
        isScrollable = true;
      }
      el = el.parentNode;
    }
    if (el.className.indexOf("ft-B") != -1 && el.scrollHeight > el.clientHeight - 1) {
      isScrollable = true;
    }
    if (isScrollable === true) {
      if (el.scrollHeight - el.scrollTop === el.clientHeight || (el.scrollTop === 0 && el.alreadyScrolled && el.alreadyScrolled === true)) {
        isScrollable = false;
      }
      el.alreadyScrolled = true;
    }
    return isScrollable;
  }

  function enableMomentumScroll() {
    clearTimeout(_momentumScrollTimeout);
    _isScrolling = false;
  }

  function disableMomentumScroll() {
    _momentumScrollTimeout = setTimeout(enableMomentumScroll, _momentumScrollDelay);
  }

  function doScrollOnce(e) {
    //
    _isScrolling = true;
    disableMomentumScroll();
    //
    if (e.deltaY === 0) {
      if (e.deltaX > 0) {
        if (_crossDirection === true) {
          _nextB_Cord();
        } else {
          _nextA_Cord(undefined, e.shiftKey);
        }
      } else if (e.deltaX < 0) {
        if (_crossDirection === true) {
          _prevB_Cord();
        } else {
          _prevA_Cord(undefined, e.shiftKey);
        }
      }
    } else {
      if (e.deltaY > 0) {
        if (_crossDirection === true) {
          _nextA_Cord(undefined, e.shiftKey);
        } else {
          _nextB_Cord();
        }
      } else if (e.deltaY < 0) {
        if (_crossDirection === true) {
          _prevA_Cord(undefined, e.shiftKey);
        } else {
          _prevB_Cord();
        }
      }
    }
  }

/*
  ########  ########  ######  #### ######## ########
  ##     ## ##       ##    ##  ##       ##  ##
  ##     ## ##       ##        ##      ##   ##
  ########  ######    ######   ##     ##    ######
  ##   ##   ##             ##  ##    ##     ##
  ##    ##  ##       ##    ##  ##   ##      ##
  ##     ## ########  ######  #### ######## ########
*/

  /**
   * monitoring function that triggers hashChange when resizing window
   */
  var resizeMonitor = (function _resizeMonitor() {
    var ticker = NaN;
    function _enable() {
      _disable();
      if (!_isOverview) {
        ticker = setTimeout(doResizeHandler, 300);
      }
    }

    function _disable() {
      clearTimeout(ticker);
    }

    function doResizeHandler() {
      NavigationMatrix.updateOffsets();
      navigateTo();
    }

    Brav1Toolbox.addListener(window, "resize", _enable);
    window.addEventListener("orientationchange", _enable, false);

    return {
      enable: _enable,
      disable: _disable
    };
  })();

/*
  ##     ## ######## #### ##        ######
  ##     ##    ##     ##  ##       ##    ##
  ##     ##    ##     ##  ##       ##
  ##     ##    ##     ##  ##        ######
  ##     ##    ##     ##  ##             ##
  ##     ##    ##     ##  ##       ##    ##
   #######     ##    #### ########  ######
*/

  /**
   * returns the element by parsing the hash
   * @param h String  the hash string to evaluate
   */
  function getElementByHash(h) {
    if (h.length > 0) {
      var aHash = h.replace("#/", "").split("/");
      if (aHash.length > 0) {
        var dataProgA_Cord = document.querySelectorAll(A_CORD_SELECTOR + "[data-prog=__" + aHash[0] + "]");
        var dataIdA_Cord = document.querySelectorAll(A_CORD_SELECTOR + "[data-id=__" + aHash[0] + "]");
        var ps = dataProgA_Cord.length > 0 ? dataProgA_Cord : dataIdA_Cord;
        var sp = null;
        var p = null;
        if (ps !== null) {
          for (var i = 0; i < ps.length; i++) {
            p = ps[i];
            if (aHash.length > 1) {
              sp = p.querySelector(B_CORD_SELECTOR + "[data-prog=__" + aHash[1] + "]") || p.querySelector(B_CORD_SELECTOR + "[data-id=__" + aHash[1] + "]");
            }
            if (sp !== null) {
              break;
            }
          }
          if (sp === null && p) {
            sp = p.querySelector(B_CORD_SELECTOR);
          }
        }
        return sp;
      }
    }
    return;
  }

/*
##     ## ########  ########     ###    ######## ########    ##    ##    ###    ##     ## ####  ######      ###    ######## ####  #######  ##    ## 
##     ## ##     ## ##     ##   ## ##      ##    ##          ###   ##   ## ##   ##     ##  ##  ##    ##    ## ##      ##     ##  ##     ## ###   ## 
##     ## ##     ## ##     ##  ##   ##     ##    ##          ####  ##  ##   ##  ##     ##  ##  ##         ##   ##     ##     ##  ##     ## ####  ## 
##     ## ########  ##     ## ##     ##    ##    ######      ## ## ## ##     ## ##     ##  ##  ##   #### ##     ##    ##     ##  ##     ## ## ## ## 
##     ## ##        ##     ## #########    ##    ##          ##  #### #########  ##   ##   ##  ##    ##  #########    ##     ##  ##     ## ##  #### 
##     ## ##        ##     ## ##     ##    ##    ##          ##   ### ##     ##   ## ##    ##  ##    ##  ##     ##    ##     ##  ##     ## ##   ### 
 #######  ##        ########  ##     ##    ##    ########    ##    ## ##     ##    ###    ####  ######   ##     ##    ##    ####  #######  ##    ## 
*/

  /**
   * public method to force navigation updates
   */
  function _updateNavigation(fireEvent) {
    _fireEvent = fireEvent === false ? false : true;
    var currentB_CordPreUpdate = NavigationMatrix.getCurrentB_Cord();
    NavigationMatrix.update();
    //
    navigateTo(currentB_CordPreUpdate, false, false, false);
    if (_showProgress === true) {
      buildProgressIndicator();
    }
  }

  /**
   * builds and sets the title of the document parsing the attributes of the current A_Cord
   * if a data-title is available in a B_Cord and or in a A_Cord then it will be used
   * otherwise it will be used a formatted version of the hash string
   */
  function setTitle(h) {
    var t = siteName;
    var ht = NavigationMatrix.getCurrentB_Cord().getAttribute("data-title");
    if (ht === null) {
      var hs = h.split("/");
      for (var i = 0; i < hs.length; i++) {
        t += " | " + hs[i];
      }
    } else {
      if (NavigationMatrix.getCurrentA_Cord().getAttribute("data-title") !== null) {
        t += " | " + NavigationMatrix.getCurrentA_Cord().getAttribute("data-title");
      }
      t += " | " + ht;
    }
    document.title = t;
  }

  /**
   * returns a clean string of navigation atributes of the passed B_Cord
   * if there is a data-id attribute it will be returned
   * otherwise will be returned the data-prog attribute
   */
  function getB_CordId(d) {
    var tempId = d.getAttribute("data-id");
    var tempProg = d.getAttribute("data-prog");
    var ret = "";
    if (tempId !== null) {
      ret = tempId.replace(/__/, "");
    } else if (tempProg !== null) {
      ret = tempProg.replace(/__/, "");
    }
    return ret;
  }

  /**
   * returns a safe version of an attribute value
   * adding __ in front of the value
   */
  function safeAttr(a) {
    if (a.substr(0,2) != "__") {
      return "__" + a;
    } else {
      return a;
    }
  }

  /**
   * clean the save value of an attribute
   * removing __ from the beginning of the value
   */
  function unsafeAttr(a) {
    if (a.substr(0,2) == "__") {
      return a.replace(/__/, "");
    } else {
      return a;
    }
  }

/*
  ##    ##    ###    ##     ## ####  ######      ###    ######## ######## ########  #######
  ###   ##   ## ##   ##     ##  ##  ##    ##    ## ##      ##    ##          ##    ##     ##
  ####  ##  ##   ##  ##     ##  ##  ##         ##   ##     ##    ##          ##    ##     ##
  ## ## ## ##     ## ##     ##  ##  ##   #### ##     ##    ##    ######      ##    ##     ##
  ##  #### #########  ##   ##   ##  ##    ##  #########    ##    ##          ##    ##     ##
  ##   ### ##     ##   ## ##    ##  ##    ##  ##     ##    ##    ##          ##    ##     ##
  ##    ## ##     ##    ###    ####  ######   ##     ##    ##    ########    ##     #######
*/

  /**
   * navigation transition logic
   * @param dest HTMLElement  the B_Cord to go to
   * @param push Boolean if true the hash string were pushed to the history API
   * @param linked Boolean if true triggers a forced update of all the fragments in the B_Cords, used when navigating from links or overview
   * @param withTransitions Boolean if false disables the transition during the current navigation, then reset the transitions
   */
  function navigateTo(dest, push, linked, withTransitions) {
    push = push === false ? push : true;
    // if dest doesn't exist then go to homeB_Cord
    if (!dest) {
      if (NavigationMatrix.getCurrentB_Cord() !== null) {
        dest = NavigationMatrix.getCurrentB_Cord();
      } else {
        dest = document.querySelector(B_CORD_SELECTOR);
      }
      push = true;
    }
    // checks what properties use for navigation and set the style
    if (withTransitions === false) {
      _pauseTransitions();
    } else if (_transitionPaused === true) {
      _restoreTransitions();
    }
    navigate(dest);
    if (_transitionPaused === true) {
      _restoreTransitions(true);
    }
    //
    moveParallax(dest);
    //
    if (_isOverview) {
      _toggleOverview(false, false);
    }
    //
    var h = NavigationMatrix.getHash(dest);
    if (linked === true) {
      NavigationMatrix.updateFragments();
    }
    // set history properties
    var B_CordIndex = NavigationMatrix.getB_CordIndex(dest);
    if (pastIndex.A_Cord != B_CordIndex.A_Cord || pastIndex.B_Cord != B_CordIndex.B_Cord) {
      if (pushHistory !== null && push !== false && NavigationMatrix.getCurrentFragmentIndex() === -1) {
        var stateObj = { token: h };
        var nextHash = "#/" + h;
        currentHash = nextHash;
        try {
          window.history.pushState(stateObj, null, currentHash);
        } catch (error) {
          if (_showErrors === true) {
            console.log(error);
          }
        }
      } else {
        document.location.hash = "/" + h;
      }
    }
    // set the title
    setTitle(h);
    //

    // store the status of the A_Cord, the last B_Cord visited in the A_Cord
    _A_CordsStatus[B_CordIndex.A_Cord] = B_CordIndex.B_Cord;

    // store the last B_Cord index visited using up or down only if the A_Cord have the same number of B_Cords or more
    if (pastIndex.A_Cord === B_CordIndex.A_Cord && pastIndex.B_Cord !== B_CordIndex.B_Cord) {
      _A_CordsLastB_CordDepth = B_CordIndex.B_Cord;
    }

    // dispatches an event populated with navigation data
    fireNavigationEvent();
    // cache the A_Cord and B_Cord index, useful to determine the direction of the next navigation
    pastIndex = B_CordIndex;
    NavigationMatrix.switchActiveB_Cord(dest, true);
    //
    if (_showProgress) {
      updateProgress();
    }

  }

  /**
   * fires the navigation event and, if exists, call the navigation callback
   */
  function fireNavigationEvent() {
    if (_fireEvent !== false) {
      var B_CordIndex = NavigationMatrix.getB_CordIndex();
      var eventData = {
                        A_Cord          : NavigationMatrix.getCurrentA_Cord(),
                        B_Cord             : NavigationMatrix.getCurrentB_Cord(),
                        A_CordIndex     : B_CordIndex.A_Cord,
                        B_CordIndex        : B_CordIndex.B_Cord,
                        pastA_CordIndex : pastIndex.A_Cord,
                        pastB_CordIndex    : pastIndex.B_Cord,
                        prevA_Cord      : NavigationMatrix.hasPrevA_Cord(),
                        nextA_Cord      : NavigationMatrix.hasNextA_Cord(),
                        prevB_Cord         : NavigationMatrix.hasPrevB_Cord(),
                        nextB_Cord         : NavigationMatrix.hasNextB_Cord(),
                        fragment         : NavigationMatrix.getCurrentFragment(),
                        fragmentIndex    : NavigationMatrix.getCurrentFragmentIndex(),
                        isOverview       : _isOverview,
                        progress         : NavigationMatrix.getProgress(),
                        total            : NavigationMatrix.getB_CordsTotalLength(),
                        isLoopable       : _isLoopable,
                        clickerMode      : _clickerMode,
                        isAutoplay       : _isAutoplay
                      };
      Brav1Toolbox.dispatchEvent(NAVIGATION_EVENT, eventData);
      //
      if (_navigationCallback !== null) {
        _navigationCallback(eventData);
      }
    } else {
      _fireEvent = true;
    }
  }

/*
##    ##    ###    ##     ## ####  ######      ###    ######## ######## 
###   ##   ## ##   ##     ##  ##  ##    ##    ## ##      ##    ##       
####  ##  ##   ##  ##     ##  ##  ##         ##   ##     ##    ##       
## ## ## ##     ## ##     ##  ##  ##   #### ##     ##    ##    ######   
##  #### #########  ##   ##   ##  ##    ##  #########    ##    ##       
##   ### ##     ##   ## ##    ##  ##    ##  ##     ##    ##    ##       
##    ## ##     ##    ###    ####  ######   ##     ##    ##    ######## 
*/

  /**
   * check the availability of transform CSS property
   * if transform is not available then fallbacks to position absolute behaviour
   */
  function navigate(dest) {
    var x;
    var y;
    var B_CordIndex = NavigationMatrix.getB_CordIndex(dest);
    if (_slideInPx === true) {
      // calculate the coordinates of the destination
      x = dest.x;
      y = dest.y;
    } else {
      // calculate the index of the destination B_Cord
      if (_crossDirection === true) {
        y = B_CordIndex.A_Cord;
        x = B_CordIndex.B_Cord;
      } else {
        x = B_CordIndex.A_Cord;
        y = B_CordIndex.B_Cord;
      }
    }
    if (_scrollTheA_Cord === true) {
      var A_CordDest = dest.parentNode;
      var outside = ftContainer;
      var inside = A_CordDest;
      if (_crossDirection === true) {
        outside = A_CordDest;
        inside = ftContainer;
      }
      if (_supportsTransform) {
        //
        if (_slideInPx) {
          outside.style[_transformProperty] = "translateX(" + (-x) + "px)";
        } else {
          outside.style[_transformProperty] = "translateX(" + -x * 100 + "%)";
        }
        if (_slideInPx) {
          inside.style[_transformProperty] = "translateY(" + (-y) + "px)";
        } else {
          inside.style[_transformProperty] = "translateY(" + (-y) * 100 + "%)";
        }
      } else {
        if (_slideInPx) {
          outside.style.left = (x) + "px";
        } else {
          outside.style.left = -x * 100 + "%";
        }
        if (_slideInPx) {
          inside.style.top = (y) + "px";
        } else {
          inside.style.top = -y * 100 + "%";
        }
      }
    } else {
      if (_supportsTransform) {
        if (_slideInPx) {
          ftContainer.style[_transformProperty] = "translateX(" + (-x) + "px) translateY(" + (-y) + "px)";
        } else {
          ftContainer.style[_transformProperty] = "translateX(" + (-x) * 100 + "%) translateY(" + (-y) * 100 + "%)";
        }
      } else {
        if (_slideInPx) {
          ftContainer.style.top = (-y) + "px";
          ftContainer.style.left = (-x) + "px";
        } else {
          ftContainer.style.top = (-y) * 100 + "%";
          ftContainer.style.left = (-x) * 100 + "%";
        }
      }
    }
    resetScroll();
  }

  function moveParallax(dest) {
    if (_parallaxEnabled) {
      var B_CordIndex = NavigationMatrix.getB_CordIndex(dest);
      //
      var pxElements = NavigationMatrix.getParallaxElements();
      for (var i = 0; i < pxElements.length; i++) {
        var pxA_Cord = pxElements[i];
        if (pxA_Cord !== undefined) {
          for (var ii = 0; ii < pxA_Cord.length; ii++) {
            var pxB_Cord = pxA_Cord[ii];
            if (pxB_Cord !== undefined) {
              for (var iii = 0; iii < pxB_Cord.length; iii++) {
                var pxElement = pxB_Cord[iii];
                var pX = 0;
                var pY = 0;
                // A_Cords
                if (B_CordIndex.A_Cord < i) {
                  pX = pxElement.pX;
                } else if (B_CordIndex.A_Cord > i) {
                  pX = -pxElement.pX;
                }
                // B_Cords
                if (B_CordIndex.B_Cord < ii) {
                  pY = pxElement.pY;
                } else if (B_CordIndex.B_Cord > ii) {
                  pY = -pxElement.pY;
                }
                // animation
                var unit = "%";
                if (_parallaxInPx) {
                  unit = "px";
                }
                if (_crossDirection === true) {
                  pxElement.style[_transformProperty] = "translateX(" + pY + unit + ") translateY(" + pX + unit + ")";
                } else {
                  pxElement.style[_transformProperty] = "translateX(" + pX + unit + ") translateY(" + pY + unit + ")";
                }
              }
            }
          }
        }
      }
    }
  }

  function resetScroll() {
    window.scrollTo(0,0); // fix the eventually occurred B_Cord scrolling resetting the scroll values to 0
  }

/*
  ########  ########   #######   ######   ########  ########  ######   ######
  ##     ## ##     ## ##     ## ##    ##  ##     ## ##       ##    ## ##    ##
  ##     ## ##     ## ##     ## ##        ##     ## ##       ##       ##
  ########  ########  ##     ## ##   #### ########  ######    ######   ######
  ##        ##   ##   ##     ## ##    ##  ##   ##   ##             ##       ##
  ##        ##    ##  ##     ## ##    ##  ##    ##  ##       ##    ## ##    ##
  ##        ##     ##  #######   ######   ##     ## ########  ######   ######
*/
  var progressFill = null;

  function buildProgressIndicator() {
    if (defaultProgress) {
      defaultProgress.parentNode.removeChild(defaultProgress);
    }
    var domFragment = document.createDocumentFragment();
    // create the progress container div
    defaultProgress = document.createElement("div");
    defaultProgress.className = DEFAULT_PROGRESS_CLASS + (_crossDirection === true ? " ft-cross" : "");
    domFragment.appendChild(defaultProgress);
    // loop through A_Cords
    for (var i = 0; i < NavigationMatrix.getA_CordsLength(); i++) {
      var pDiv = document.createElement("div");
        pDiv.setAttribute("data-A_Cord", "__" + i);
        pDiv.className = A_CORD_THUMB_CLASS;
        Brav1Toolbox.addClass(pDiv, "thumb-A_Cord-" + i);
      // loop through B_Cords
      var spArray = NavigationMatrix.getB_Cords(i);
      for (var ii = 0; ii < spArray.length; ii++) {
        var spDiv = document.createElement("div");
          spDiv.className = B_CORD_THUMB_CLASS;
          spDiv.setAttribute("data-A_Cord", "__" + i);
          spDiv.setAttribute("data-B_Cord", "__" + ii);
          Brav1Toolbox.addClass(spDiv, "thumb-B_Cord-" + ii);
          pDiv.appendChild(spDiv);
      }
      defaultProgress.appendChild(pDiv);
    }
    body.appendChild(defaultProgress);
    updateProgress();
  }

  function hideProgressIndicator() {
    if (defaultProgress !== null) {
      body.removeChild(defaultProgress);
      defaultProgress = null;
    }
  }

  function updateProgress() {
    if (defaultProgress !== null) {
      var spts = defaultProgress.querySelectorAll(B_CORD_THUMB_SELECTOR);
      for (var i = 0; i < spts.length; i++) {
        var spt = spts[i];
        var pTo = Number(unsafeAttr(spt.getAttribute("data-A_Cord")));
        var spTo = Number(unsafeAttr(spt.getAttribute("data-B_Cord")));
        if (pTo == NavigationMatrix.getB_CordIndex().A_Cord && spTo == NavigationMatrix.getB_CordIndex().B_Cord) {
          Brav1Toolbox.addClass(spts[i], "actual");
        } else {
          Brav1Toolbox.removeClass(spts[i], "actual");
        }
      }

    }
  }

  function _getDefaultProgress() {
    return defaultProgress;
  }

/*
   #######  ##     ## ######## ########  ##     ## #### ######## ##      ##    ##     ##    ###    ##    ##    ###     ######   ######## ##     ## ######## ##    ## ########
  ##     ## ##     ## ##       ##     ## ##     ##  ##  ##       ##  ##  ##    ###   ###   ## ##   ###   ##   ## ##   ##    ##  ##       ###   ### ##       ###   ##    ##
  ##     ## ##     ## ##       ##     ## ##     ##  ##  ##       ##  ##  ##    #### ####  ##   ##  ####  ##  ##   ##  ##        ##       #### #### ##       ####  ##    ##
  ##     ## ##     ## ######   ########  ##     ##  ##  ######   ##  ##  ##    ## ### ## ##     ## ## ## ## ##     ## ##   #### ######   ## ### ## ######   ## ## ##    ##
  ##     ##  ##   ##  ##       ##   ##    ##   ##   ##  ##       ##  ##  ##    ##     ## ######### ##  #### ######### ##    ##  ##       ##     ## ##       ##  ####    ##
  ##     ##   ## ##   ##       ##    ##    ## ##    ##  ##       ##  ##  ##    ##     ## ##     ## ##   ### ##     ## ##    ##  ##       ##     ## ##       ##   ###    ##
   #######     ###    ######## ##     ##    ###    #### ########  ###  ###     ##     ## ##     ## ##    ## ##     ##  ######   ######## ##     ## ######## ##    ##    ##
*/

  /**
   * switch from the overview states
   */
  function _toggleOverview(back, navigate) {
    if (_isOverview) {
      zoomIn(back, navigate);
    } else {
      overviewCachedDest = NavigationMatrix.getCurrentB_Cord();
      zoomOut();
    }
  }

  /**
   * set the overview state to the given value
   */
  function _setShowOverview(v, back, navigate) {
    if (_isOverview === v) {
      return;
    }
    _isOverview = !v;
    _toggleOverview(back, navigate);
  }

  /**
   * zoom in the view to focus on the current A_Cord / B_Cord
   */
  function zoomIn(back, navigate) {
    _isOverview = false;
    Brav1Toolbox.removeClass(body, "ft-overview");
    NavigationMatrix.hideFragments();
    navigate = navigate === false ? false : true;
    if (navigate === true) {
      if (back === true) {
        navigateTo(overviewCachedDest);
      } else {
        navigateTo();
      }
    }
  }

  /**
   * zoom out the view for an overview of all the A_Cords / B_Cords
   */
  function zoomOut() {
    _isOverview = true;
    Brav1Toolbox.addClass(body, "ft-overview");
    NavigationMatrix.showFragments();
    //
    if (_useOverviewVariant === false) {
      overviewZoomTypeA(true);
    } else {
      overviewZoomTypeB(true);
    }
    fireNavigationEvent();
  }

  function overviewZoomTypeA(out) {
    // ftContainer scale version
    if (out) {
      var scaleX, scaleY;
      if (_crossDirection === true) {
        scaleY = 100 / NavigationMatrix.getA_CordsLength();
        scaleX = 100 / NavigationMatrix.getB_CordsLength();
      } else {
        scaleX = 100 / NavigationMatrix.getA_CordsLength();
        scaleY = 100 / NavigationMatrix.getB_CordsLength();
      }
      //
      scale = Math.min(scaleX, scaleY) * 0.9;
      var offsetX = (100 - NavigationMatrix.getA_CordsLength() * scale) / 2;
      var offsetY = (100 - NavigationMatrix.getB_CordsLength() * scale) / 2;
      //
      ftContainer.style[_transformProperty] = "translate(" + offsetX + "%, " + offsetY + "%) scale(" + scale/100 + ", " + scale/100 + ")";
    }
  }

  function overviewZoomTypeB(out) {
    // ftContainer scale alternative version
    if (out) {
      scale = overviewFixedScaleFactor; // Math.min(scaleX, scaleY) * 0.9;
      var pIndex = NavigationMatrix.getB_CordIndex();
      //
      var offsetY, offsetX;
      if (_crossDirection === true) {
        offsetY = 50 - (scale * pIndex.A_Cord) - (scale / 2);
        offsetX = 50 - (scale * pIndex.B_Cord) - (scale / 2);
      } else {
        offsetX = 50 - (scale * pIndex.A_Cord) - (scale / 2);
        offsetY = 50 - (scale * pIndex.B_Cord) - (scale / 2);
      }
      //
      ftContainer.style[_transformProperty] = "translate(" + offsetX + "%, " + offsetY + "%) scale(" + scale/100 + ", " + scale/100 + ")";
    }
  }

/*
  ##    ## ######## ##    ## ########   #######     ###    ########  ########     ##    ##    ###    ##     ## ####  ######      ###    ######## ####  #######  ##    ##
  ##   ##  ##        ##  ##  ##     ## ##     ##   ## ##   ##     ## ##     ##    ###   ##   ## ##   ##     ##  ##  ##    ##    ## ##      ##     ##  ##     ## ###   ##
  ##  ##   ##         ####   ##     ## ##     ##  ##   ##  ##     ## ##     ##    ####  ##  ##   ##  ##     ##  ##  ##         ##   ##     ##     ##  ##     ## ####  ##
  #####    ######      ##    ########  ##     ## ##     ## ########  ##     ##    ## ## ## ##     ## ##     ##  ##  ##   #### ##     ##    ##     ##  ##     ## ## ## ##
  ##  ##   ##          ##    ##     ## ##     ## ######### ##   ##   ##     ##    ##  #### #########  ##   ##   ##  ##    ##  #########    ##     ##  ##     ## ##  ####
  ##   ##  ##          ##    ##     ## ##     ## ##     ## ##    ##  ##     ##    ##   ### ##     ##   ## ##    ##  ##    ##  ##     ##    ##     ##  ##     ## ##   ###
  ##    ## ########    ##    ########   #######  ##     ## ##     ## ########     ##    ## ##     ##    ###    ####  ######   ##     ##    ##    ####  #######  ##    ##
*/

  /**
   * KEYBOARD NAVIGATION
   */
  Brav1Toolbox.addListener(window, "keydown", onKeyDown);
  Brav1Toolbox.addListener(window, "keyup", onKeyUp);

  function onKeyDown(e) {
    var tag = e.target.tagName;
    if (tag != "INPUT" && tag != "TEXTAREA" && tag != "SELECT") {
      if (e.keyCode >= 37 && e.keyCode <= 40) {
        e.preventDefault();
      }
    }
  }

  function onKeyUp(e) {
    if (_isKeyboardActive) {
      var tag = e.target.tagName;
      var elem;
      if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        switch (e.keyCode) {
          case 27 : // esc
            _toggleOverview(true);
            break;
          case 33 : // pag up
            if (_clickerMode) {
              _prevB_Cord(e.shiftKey);
            } else {
              _gotoTop();
            }
            break;
          case 34 : // pag down
            if (_clickerMode) {
              _nextB_Cord(e.shiftKey);
            } else {
              _gotoBottom();
            }
            break;
          case 35 : // end
            _gotoEnd();
            break;
          case 36 : // home
            _gotoHome();
            break;
          case 37 : // left
            if (_crossDirection === true) {
              _prevB_Cord(e.shiftKey);
            } else {
              _prevA_Cord(null, e.shiftKey);
            }
            break;
          case 39 : // right
            if (_crossDirection === true) {
              _nextB_Cord(e.shiftKey);
            } else {
              _nextA_Cord(null, e.shiftKey);
            }
            break;
          case 38 : // up
            if (_crossDirection === true) {
              _prevA_Cord(null, e.shiftKey);
            } else {
              _prevB_Cord(e.shiftKey);
            }
            break;
          case 40 : // down
            if (_crossDirection === true) {
              _nextA_Cord(null, e.shiftKey);
            } else {
              _nextB_Cord(e.shiftKey);
            }
            break;
          case 13 : // return
            if (_isOverview) {
              _gotoB_Cord(NavigationMatrix.getCurrentHilited());
            }
            break;
          default :
            break;
        }
      }
    }
  }

/**
     ###    ##     ## ########  #######  ########  ##          ###    ##    ##
    ## ##   ##     ##    ##    ##     ## ##     ## ##         ## ##    ##  ##
   ##   ##  ##     ##    ##    ##     ## ##     ## ##        ##   ##    ####
  ##     ## ##     ##    ##    ##     ## ########  ##       ##     ##    ##
  ######### ##     ##    ##    ##     ## ##        ##       #########    ##
  ##     ## ##     ##    ##    ##     ## ##        ##       ##     ##    ##
  ##     ##  #######     ##     #######  ##        ######## ##     ##    ##
*/

  var _isAutoplay = false;
  var autoplayTimer = 0;
  var autoplayDelay = 10000;
  var autoplaySkipFragments = false;
  var autoplayTimerStartedAt = 0;
  var autoplayTimerPausedAt = 0;
  /**
   * sets the autoplay status
   * @param status  Boolean if true configure the presentation for auto playing
   * @param   delay   Number sets the delay for the autoplay timeout in milliseconds (default 10 seconds)
   * @param   autostart   Boolean if true the autoplay starts right now (default true)
   * @param   skipFragments   Boolean if true goes to the next B_Cord skipping all the fragments (default false)
   */
  function _autoplay(status, delay, autostart, skipFragments) {
    autoplayDelay = isNaN(parseInt(delay)) ? autoplayDelay : delay;
    autoplaySkipFragments = skipFragments === true || false;
    if (status === true && autostart !== false) {
      _play();
    }
  }

  function _play() {
    _isAutoplay = true;
    clearTimeout(autoplayTimer);
    autoplayTimerStartedAt = Date.now();
    autoplayTimer = setTimeout(function(){
      _nextB_Cord(autoplaySkipFragments);
      _play();
    }, autoplayDelay - autoplayTimerPausedAt);
    autoplayTimerPausedAt = 0;
  }

  function _pause() {
    _isAutoplay = false;
    autoplayTimerPausedAt = Date.now() - autoplayTimerStartedAt;
    clearTimeout(autoplayTimer);
  }

  function _stop() {
    _isAutoplay = false;
    clearTimeout(autoplayTimer);
    autoplayTimerStartedAt = 0;
    autoplayTimerPausedAt = 0;
  }

/*
  ########  ##     ## ########  ##       ####  ######        ###    ########  ####
  ##     ## ##     ## ##     ## ##        ##  ##    ##      ## ##   ##     ##  ##
  ##     ## ##     ## ##     ## ##        ##  ##           ##   ##  ##     ##  ##
  ########  ##     ## ########  ##        ##  ##          ##     ## ########   ##
  ##        ##     ## ##     ## ##        ##  ##          ######### ##         ##
  ##        ##     ## ##     ## ##        ##  ##    ##    ##     ## ##         ##
  ##         #######  ########  ######## ####  ######     ##     ## ##        ####
*/


  /**
   * triggers the first animation when visiting the site
   * if the hash is not empty
   */
  function _start() {
    // init and configuration
    if (_showProgress && defaultProgress === null) {
      buildProgressIndicator();
    }
    // start navigation
    if (document.location.hash.length > 0) {
      _pauseTransitions(true);
      onHashChange(null, true);
    } else {
      if (_start.arguments.length > 0) {
        _gotoB_Cord.apply(this, _start.arguments);
      } else {
        _gotoB_Cord(0,0);
        updateProgress();
      }
    }
  }

  function _pauseTransitions(restoreAfter) {
    _transitionPaused = true;
    ftContainer.style[Brav1Toolbox.getPrefixed("transition-duration")] = "0ms";
    if (restoreAfter === true) {
      setTimeout(_restoreTransitions, _transitionTime);
    }
  }

  function _restoreTransitions(withTransitionDelay) {
    _transitionPaused = false;
    if (withTransitionDelay === true) {
      setTimeout(function() {
        ftContainer.style[Brav1Toolbox.getPrefixed("transition-duration")] = "" + _transitionTime / 1000 + "s";
      }, _transitionTime);
    } else {
      ftContainer.style[Brav1Toolbox.getPrefixed("transition-duration")] = "" + _transitionTime / 1000 + "s";
    }

  }

  /*
   * Public API to go to the next A_Cord
   * @param top Boolean if true the next A_Cord will be the first B_Cord in the next array; if false the next A_Cord will be the same index B_Cord in the next array
   */
  function _nextA_Cord(top, alternate) {
    if (_A_CordNavigationNext === true) {
      top = top !== null ? top : _gridNavigation;
      if (alternate === true) {
        top = !_gridNavigation;
      }
      var d = NavigationMatrix.getNextA_Cord(top, _fragmentsOnSide);
      if (d !== undefined) {
        navigateTo(d);
      } else {
        if (_isOverview && _useOverviewVariant) {
          zoomOut();
        }
      }
    }
  }

  /*
   * Public API to go to the prev A_Cord
   *
   */
  function _prevA_Cord(top, alternate) {
    if (_A_CordNavigationPrev === true) {
      top = top !== null ? top : _gridNavigation;
      if (alternate === true) {
        top = !_gridNavigation;
      }
      var d = NavigationMatrix.getPrevA_Cord(top, _fragmentsOnSide);
      if (d !== undefined) {
        navigateTo(d);
      } else {
        if (_isOverview && _useOverviewVariant) {
          zoomOut();
        }
      }
    }
  }

  /*
   * Public API to go to the next B_Cord
   */
  function _nextB_Cord(jump) {
    if (_B_CordNavigationNext === true) {
      var d = NavigationMatrix.getNextB_Cord(jump);
      if (d === false) {
        return;
      }
      if (d !== undefined) {
        navigateTo(d);
      } else {
        if (_isOverview && _useOverviewVariant) {
          zoomOut();
        }
      }
    }
  }

  /*
   * Public API to go to the prev B_Cord
   */
  function _prevB_Cord(jump) {
    if (_B_CordNavigationPrev === true) {
      var d = NavigationMatrix.getPrevB_Cord(jump);
      if (d === false) {
        return;
      }
      if (d !== undefined) {
        navigateTo(d);
      } else {
        if (_isOverview && _useOverviewVariant) {
          zoomOut();
        }
      }
    }
  }

  /*
   * Public API to go to a specified A_Cord / B_Cord
   * the method accepts vary parameters:
   * if two numbers were passed it assumes that the first is the A_Cord index and the second is the B_Cord index;
   * if an object is passed it assumes that the object has a A_Cord property and a B_Cord property to get the indexes to navigate;
   * if an HTMLElement is passed it assumes the element is a destination B_Cord
   */
  function _gotoB_Cord() {
    var args = _gotoB_Cord.arguments;
    if (args.length > 0) {
      var spd = null;
      if (args.length == 1) {
        if (Brav1Toolbox.typeOf(args[0]) === "Object") {
          var o = args[0];
          var p = o.A_Cord;
          var sp = o.B_Cord;
          if (p !== null && p !== undefined) {
            var pd = document.querySelector(A_CORD_SELECTOR + "[data-id=" + safeAttr(p) + "]");
            if (sp !== null && sp !== undefined) {
              spd = pd.querySelector(B_CORD_SELECTOR + "[data-id=" + safeAttr(sp) + "]");
              if (spd !== null) {
                navigateTo(spd);
                return;
              }
            }
          }
        } else if (args[0].nodeName !== undefined) {
          navigateTo(args[0], null, true);
        }
      }
      if (Brav1Toolbox.typeOf(args[0]) === "Number" || args[0] === 0) {
        spd = NavigationMatrix.getB_CordByIndex(args[1], args[0]);
        navigateTo(spd);
        return;
      }
    }
  }

  function _gotoHome() {
    _gotoB_Cord(0,0);
  }

  function _gotoEnd() {
    var sl = NavigationMatrix.getA_CordsLength() - 1;
    _gotoB_Cord(sl, NavigationMatrix.getB_Cords(sl).length - 1);
  }

  function _gotoTop() {
    if (_B_CordNavigationPrev === true) {
      var B_CordIndex = NavigationMatrix.getB_CordIndex();
      _gotoB_Cord(B_CordIndex.A_Cord, 0);
    }
  }

  function _gotoBottom() {
    if (_B_CordNavigationNext === true) {
      var B_CordIndex = NavigationMatrix.getB_CordIndex();
      _gotoB_Cord(B_CordIndex.A_Cord, NavigationMatrix.getB_Cords(B_CordIndex.A_Cord).length - 1);
    }
  }

  function _addEventListener(type, handler, useCapture) {
    Brav1Toolbox.addListener(document, type, handler, useCapture);
  }

/*
   ######  ######## ######## ######## ######## ########   ######
  ##    ## ##          ##       ##    ##       ##     ## ##    ##
  ##       ##          ##       ##    ##       ##     ## ##
   ######  ######      ##       ##    ######   ########   ######
        ## ##          ##       ##    ##       ##   ##         ##
  ##    ## ##          ##       ##    ##       ##    ##  ##    ##
   ######  ########    ##       ##    ######## ##     ##  ######
*/

  function _setFragmentsOnSide(v) {
    _fragmentsOnSide = v === true ? true : false;
    _setFragmentsOnBack(v);
  }

  function _setFragmentsOnBack(v) {
    _fragmentsOnBack = v === true ? true : false;
  }

  function _setUseHistory(v){
    pushHistory = v === true ? true : false;
  }

  function _setSlideInPx(v) {
    _slideInPx = v === true ? true : false;
    if (_slideInPx === true) {
      NavigationMatrix.updateOffsets();
    }
    navigateTo();
  }

  function _setBackFromB_CordToTop(v) {
    _backFromB_CordToTop = v === true ? true : false;
  }

  function _setNearestToTop(v) {
    _nearestToTop = v === true ? true : false;
  }

  function _setGridNavigation(v) {
    _gridNavigation = v === true ? false : true;
  }

  function _setUseOverviewVariant(v) {
    _useOverviewVariant = v === true ? true : false;
  }

  function _setTwoStepsSlide(v) {
    _twoStepsSlide = v === true ? true : false;
  }

  function _setShowProgress(v) {
    _showProgress = v === true ? true : false;
    if (_showProgress) {
      if (defaultProgress === null) {
        buildProgressIndicator();
      }
      updateProgress();
    } else {
      if (defaultProgress !== null) {
        hideProgressIndicator();
      }
    }
  }

  function _setDefaultParallaxValues(x, y) {
    _defaultParallaxX = x;
    _defaultParallaxY = y === undefined ? _defaultParallaxX : y;
    NavigationMatrix.update();
  }

  function _setParallaxInPx(v) {
    _parallaxInPx = v === true ? true : false;
  }

  function _getA_CordIndex() {
    return NavigationMatrix.getB_CordIndex().A_Cord;
  }

  function _getB_CordIndex() {
    return NavigationMatrix.getB_CordIndex().B_Cord;
  }

  function _loop(v) {
    _isLoopable = v === true ? true : false;
  }

  function _clicker(v) {
    _clickerMode = v === true ? true : false;
  }

  function _enableNavigation(links, keyboard, scroll, touch) {
    _areLinksActive = links === false ? false : true;
    _isKeyboardActive = keyboard === false ? false : true;
    _isScrollActive = scroll === false ? false : true;
    _isTouchActive = touch === false ? false : true;
  }

  function _disableNavigation(links, keyboard, scroll, touch) {
    _areLinksActive = links === false ? true : false;
    _isKeyboardActive = keyboard === false ? true : false;
    _isScrollActive = scroll === false ? true : false;
    _isTouchActive = touch === false ? true : false;
  }

  function _enableA_CordNavigation(prev, next) {
    _A_CordNavigationPrev = prev === false ? false : true;
    _A_CordNavigationNext = next === false ? false : true;
  }

  function _disableA_CordNavigation(prev, next) {
    _A_CordNavigationPrev = prev === false ? true : false;
    _A_CordNavigationNext = next === false ? true : false;
  }

  function _enableB_CordNavigation(prev, next) {
    _B_CordNavigationPrev = prev === false ? false : true;
    _B_CordNavigationNext = next === false ? false : true;
  }

  function _disableB_CordNavigation(prev, next) {
    _B_CordNavigationPrev = prev === false ? true : false;
    _B_CordNavigationNext = next === false ? true : false;
  }

  function _setLinksNavigation(v) {
    _areLinksActive = v === false ? false : true;
  }

  function _setKeyboardNavigation(v) {
    _isKeyboardActive = v === false ? false : true;
  }

  function _setScrollNavigation(v) {
    _isScrollActive = v === false ? false : true;
  }

  function _setTouchNavigation(v) {
    _isTouchActive = v === false ? false : true;
  }

  function _setCrossDirection(v) {
    if (_crossDirection !== v) {
      _crossDirection = v === true ? true : false;
      if (!Brav1Toolbox.hasClass(ftContainer, CROSS_DIRECTION_CLASS) && _crossDirection === true) {
        Brav1Toolbox.addClass(ftContainer, CROSS_DIRECTION_CLASS);
      } else if (Brav1Toolbox.hasClass(ftContainer, CROSS_DIRECTION_CLASS) && _crossDirection !== true) {
        Brav1Toolbox.removeClass(ftContainer, CROSS_DIRECTION_CLASS);
      }
      if (defaultProgress) {
        if (!Brav1Toolbox.hasClass(defaultProgress, CROSS_DIRECTION_CLASS) && _crossDirection === true) {
          Brav1Toolbox.addClass(defaultProgress, CROSS_DIRECTION_CLASS);
        } else if (Brav1Toolbox.hasClass(defaultProgress, CROSS_DIRECTION_CLASS) && _crossDirection !== true) {
          Brav1Toolbox.removeClass(defaultProgress, CROSS_DIRECTION_CLASS);
        }
      }
      //
      NavigationMatrix.updateOffsets();
      navigateTo();
    }
  }

  function _setScrollTheA_Cord(v) {
    if (_scrollTheA_Cord !== v) {
      _scrollTheA_Cord = v === true ? true : false;
      if (!Brav1Toolbox.hasClass(ftContainer, SCROLL_THE_A_CORD_CLASS) && _scrollTheA_Cord === true) {
        Brav1Toolbox.addClass(ftContainer, SCROLL_THE_A_CORD_CLASS);
      } else if (Brav1Toolbox.hasClass(ftContainer, SCROLL_THE_A_CORD_CLASS) && _scrollTheA_Cord !== true) {
        Brav1Toolbox.removeClass(ftContainer, SCROLL_THE_A_CORD_CLASS);
      }
      //
      NavigationMatrix.updateOffsets();
      navigateTo();
    }
  }

  function _setDebouncingDelay(n) {
    _debouncingDelay = n;
  }

  function _setTransitionTime(milliseconds) {
    _transitionTime = milliseconds;
    ftContainer.style[Brav1Toolbox.getPrefixed("transition-duration")] = "" + _transitionTime + "ms";
  }

  function _getTransitionTime() {
    return _transitionTime;
  }

  function _setMomentumScrollDelay(milliseconds) {
    _momentumScrollDelay = milliseconds;
  }

  function _setNavigationCallback(f) {
    _navigationCallback = f;
  }

  function _setRememberA_CordsStatus(v) {
    _rememberA_CordsStatus = v === true ? true : false;
  }

  function _setRememberA_CordsLastB_Cord(v) {
    _rememberA_CordsLastB_Cord = v === true ? true : false;
  }

  function _setToA_CordsFromB_Cords(v) {
    _toA_CordsFromB_Cords = v === false ? false : true;
  }

  /**
   * return object for public methods
   */
  return {
    start                    : _start,
    updateNavigation         : _updateNavigation,

    nextA_Cord              : _nextA_Cord,
    prevA_Cord              : _prevA_Cord,
    next                     : _nextB_Cord,
    prev                     : _prevB_Cord,
    nextFragment             : _nextB_Cord,
    prevFragment             : _prevB_Cord,
    gotoB_Cord                 : _gotoB_Cord,
    gotoHome                 : _gotoHome,
    gotoTop                  : _gotoTop,
    gotoBottom               : _gotoBottom,
    gotoEnd                  : _gotoEnd,

    toggleOverview           : _toggleOverview,
    showOverview             : _setShowOverview,
    fragmentsOnSide          : _setFragmentsOnSide,
    fragmentsOnBack          : _setFragmentsOnBack,
    useHistory               : _setUseHistory,
    slideInPx                : _setSlideInPx,
    useOverviewVariant       : _setUseOverviewVariant,
    twoStepsSlide            : _setTwoStepsSlide,
    showProgress             : _setShowProgress,
    defaultParallaxValues    : _setDefaultParallaxValues,
    parallaxInPx             : _setParallaxInPx,

    addEventListener         : _addEventListener,
    getDefaultProgress       : _getDefaultProgress,

    getA_Cord               : NavigationMatrix.getCurrentA_Cord,
    getB_Cord                  : NavigationMatrix.getCurrentB_Cord,
    getA_CordIndex          : _getA_CordIndex,
    getB_CordIndex             : _getB_CordIndex,
    getPrevA_Cord           : NavigationMatrix.getPrevA_CordObject,
    getNextA_Cord           : NavigationMatrix.getNextA_CordObject,
    getPrevB_Cord              : NavigationMatrix.getPrevB_CordObject,
    getNextB_Cord              : NavigationMatrix.getNextB_CordObject,
    autoplay                 : _autoplay,
    play                     : _play,
    pause                    : _pause,
    stop                     : _stop,
    loop                     : _loop,
    clicker                  : _clicker,
    mouseDragEnabled         : _setMouseDrag,
    enableNavigation         : _enableNavigation,
    disableNavigation        : _disableNavigation,
    enableA_CordNavigation  : _enableA_CordNavigation,
    disableA_CordNavigation : _disableA_CordNavigation,
    enableB_CordNavigation     : _enableB_CordNavigation,
    disableB_CordNavigation    : _disableB_CordNavigation,
    setLinksNavigation       : _setLinksNavigation,
    setKeyboardNavigation    : _setKeyboardNavigation,
    setScrollNavigation      : _setScrollNavigation,
    setTouchNavigation       : _setTouchNavigation,
    setCrossDirection        : _setCrossDirection,
    setDebouncingDelay       : _setDebouncingDelay,
    setTransitionTime        : _setTransitionTime,
    setMomentumScrollDelay   : _setMomentumScrollDelay,
    getTransitionTime        : _getTransitionTime,
    onNavigation             : _setNavigationCallback,

    gridNavigation           : _setGridNavigation,
    backFromB_CordToTop        : _setBackFromB_CordToTop,
    nearestB_CordToTop         : _setNearestToTop,
    rememberA_CordsStatus   : _setRememberA_CordsStatus,
    rememberA_CordsLastB_Cord : _setRememberA_CordsLastB_Cord,

    scrollTheA_Cord         : _setScrollTheA_Cord,
    toA_CordsFromB_Cords      : _setToA_CordsFromB_Cords
  };

})();
