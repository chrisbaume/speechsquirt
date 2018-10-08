import * as player from './player.js';

function launch(Keen){
  Keen.addEvent('load');

  on('mousemove', function(){
    document.querySelector('.sq .modal').style.cursor = 'auto';
  });

  (function makeSquirt(read, makeGUI) {

    on('squirt.again', startSquirt);
    injectStylesheet(sq.host + 'font-awesome.css');
    injectStylesheet(sq.host + 'squirt.css', function stylesLoaded(){
      makeGUI();
      startSquirt();
    });

    function startSquirt(){
      Keen.addEvent('start');
      player.init();
      showGUI();
      getText(read);
    };

    function getText(read){
      // text source: demo
      if(window.squirtText) return read(window.squirtText);

      // text source: selection
      var selection = window.getSelection();
      if(selection.type == 'Range') {
        var container = document.createElement("div");
        for (var i = 0, len = selection.rangeCount; i < len; ++i) {
          container.appendChild(selection.getRangeAt(i).cloneContents());
        }
        return read(container.textContent);
      }

      read(document.getElementById('transcript').innerHTML);
    };
  })(makeRead(makeTextToNodes(wordToNode)), makeGUI);

  function makeRead(textToNodes) {
    sq.paused = true;
    var nodeIdx,
        nodes,
        lastNode,
        nextNodeTimeoutId;

    function incrememntNodeIdx(increment){
      var ret = nodeIdx;
      nodeIdx += increment || 1;
      nodeIdx = Math.max(0, nodeIdx);
      prerender();
      return ret;
    };

    var _speed;
    var minSpeed = 0.2;
    var maxSpeed = 3.0;
    function speed(speed){
      _speed = speed;
    };

    (function readerEventHandlers(){
      on('squirt.close', function(){
        sq.closed = true;
        clearTimeout(nextNodeTimeoutId);
        player.pause();
        Keen.addEvent('close');
      });

      on('squirt.speed.adjust', function(e){
        let newSpeed = Math.max(Math.min(_speed + e.value, maxSpeed), minSpeed);
        dispatch('squirt.speed', {value: newSpeed});
      });

      on('squirt.speed', function(e){
        sq.speed = Number(e.value);
        speed(e.value);
        player.setSpeed(sq.speed);
        dispatch('squirt.speed.after');
        e.notForKeen == undefined && Keen.addEvent('speed', {'speed': sq.speed});
      });

      on('squirt.pause', pause);
      on('squirt.play', play);

      on('squirt.play.toggle', function(){
        dispatch(sq.paused ? 'squirt.play' : 'squirt.pause');
      });

      on('squirt.rewind', function(e){
        !sq.paused && clearTimeout(nextNodeTimeoutId);
        let newTime = Math.max(player.getCurrentTime() - e.seconds, 0);
        while(nodes[nodeIdx].start > newTime) {
          if (nodeIdx==0) break;
          incrememntNodeIdx(-1);
        }
        player.setCurrentTime(newTime);
        nextNode(true);
        Keen.addEvent('rewind');
      });
    })();

    function pause(){
      sq.paused = true;
      dispatch('squirt.pause.after');
      clearTimeout(nextNodeTimeoutId);
      player.pause();
      Keen.addEvent('pause');
    };

    function play(e){
      sq.paused = false;
      dispatch('squirt.pause.after');
      document.querySelector('.sq .speed-selector').style.display = 'none'
      nextNode(e.jumped);
      player.play();
      e.notForKeen === undefined && Keen.addEvent('play');
    };

    var toRender;
    function prerender(){
      toRender = nodes[nodeIdx];
      if(toRender == null) return;
      prerenderer.appendChild(toRender);
      nodes[nodeIdx].center();
    }

    function finalWord(){
      Keen.addEvent('final-word');
      toggle(document.querySelector('.sq .reader'));
      toggle(finalWordContainer);
      return;
    };

    var delay, jumped, nextIdx;
    function nextNode(jumped) {
      lastNode && lastNode.remove();

      nextIdx = incrememntNodeIdx();
      if(nextIdx >= nodes.length) return finalWord();

      lastNode = nodes[nextIdx];
      wordContainer.appendChild(lastNode);
      lastNode.instructions && invoke(lastNode.instructions);
      if(sq.paused) return;
      let timeout = (nodes[nextIdx+1].start - player.getCurrentTime())/sq.speed*1000;
      nextNodeTimeoutId = setTimeout(nextNode, timeout);
    };

    var waitAfterShortWord = 1.2;
    var waitAfterComma = 2;
    var waitAfterPeriod = 3;
    var waitAfterParagraph = 3.5;
    var waitAfterLongWord = 1.5;
    function getDelay(node, jumped){
      var word = node.word;
      if(jumped) return waitAfterPeriod;
      if(word == "Mr." ||
          word == "Mrs." ||
          word == "Ms.") return 1;
      var lastChar = word[word.length - 1];
      if(lastChar.match('”|"')) lastChar = word[word.length - 2];
      if(lastChar == '\n') return waitAfterParagraph;
      if('.!?'.indexOf(lastChar) != -1) return waitAfterPeriod;
      if(',;:–'.indexOf(lastChar) != -1) return waitAfterComma;
      if(word.length < 4) return waitAfterShortWord;
      if(word.length > 11) return waitAfterLongWord;
      return 1;
    };

    function showTweetButton(words, minutes){
      var html = "<div>You just read " + words + " words in " + minutes + " minutes!</div>";
      var tweetString = "I read " + words + " words in " + minutes + " minutes without breaking a sweat&mdash;www.squirt.io turns your browser into a speed reading machine!";
      var paramStr = encodeURI("url=squirt.io&user=squirtio&size=large&text=" +
          tweetString);
      html += '<iframe class=\"tweet-button\" '
               + 'allowtransparency=\"true\" frameborder=\"0\"'
               + ' scrolling=\"no\"'
               + ' src=\"https://platform.twitter.com/widgets/tweet_button.html?'
               + paramStr + '\"'
               + ' style=\"width:120px; height:20px;\"></iframe>';
      finalWordContainer.innerHTML = html;
    };

    function showInstallLink(){
      finalWordContainer.innerHTML = "<a class='install' href='/install.html'>Install Squirt</a>";
    };

    function readabilityFail(){
        Keen.addEvent('readability-fail');
        var modal = document.querySelector('.sq .modal');
        modal.innerHTML = '<div class="error">Oops! This page is too hard for Squirt to read. We\'ve been notified, and will do our best to resolve the issue shortly.</div>';
    };

    dispatch('squirt.speed', {value: 1.0, notForKeen: true});

    var wordContainer,
        prerenderer,
        finalWordContainer;
    function initDomRefs(){
      wordContainer = document.querySelector('.sq .word-container');
      invoke(wordContainer.querySelectorAll('.sq .word'), 'remove');
      prerenderer = document.querySelector('.sq .word-prerenderer');
      finalWordContainer = document.querySelector('.sq .final-word');
      document.querySelector('.sq .reader').style.display = 'block';
      document.querySelector('.sq .final-word').style.display = 'none';
    };

    return function read(text) {
      initDomRefs();
      if(!text) return readabilityFail();

      nodes = textToNodes(text);
      nodeIdx = 0;

      prerender();
      //dispatch('squirt.play');
    };
  };

  function makeTextToNodes(wordToNode) {
    return function textToNodes(text) {

      let parser = new DOMParser();
      let html = parser.parseFromString(text, 'text/html');
      let words = Array.from(html.getElementsByTagName('span'));
      return words.map(wordToNode);

      //text = "3\n 2\n 1\n " + text.trim('\n').replace(/\s+\n/g,'\n');
      //return text
             //.replace(/[\,\.\!\:\;](?![\"\'\)\]\}])/g, "$& ")
             //.split(/[\s]+/g)
             //.filter(function(word){ return word.length; })
             //.map(wordToNode);
    };
  };

  var instructionsRE = /#SQ(.*)SQ#/;
  function parseSQInstructionsForWord(word, node){
    var match = word.match(instructionsRE);
    if(match && match.length > 1){
      node.instructions = [];
      match[1].split('#')
      .filter(function(w){ return w.length; })
      .map(function(instruction){
        var val = Number(instruction.split('=')[1]);
        node.instructions.push(function(){
          dispatch('squirt.speed', {value: val, notForKeen: true})
        });
      });
      return word.replace(instructionsRE, '');
    };
    return word;
  };

  // ORP: Optimal Recgonition Point
  function getORPIndex(word){
    var length = word.length;
    var lastChar = word[word.length - 1];
    if(lastChar == '\n'){
      lastChar = word[word.length - 2];
      length--;
    }
    if(',.?!:;"'.indexOf(lastChar) != -1) length--;
    return length <= 1 ? 0 :
      (length == 2 ? 1 :
          (length == 3 ? 1 :
              Math.floor(length / 2) - 1));
  };

  function wordToNode(word) {
    var node = makeDiv({'class': 'word'});
    //node.word = parseSQInstructionsForWord(word, node);
    node.word = word.innerHTML;
    node.start = word.attributes.getNamedItem('start').value;
    node.end = word.attributes.getNamedItem('end').value;

    var orpIdx = getORPIndex(node.word);

    node.word.split('').map(function charToNode(char, idx) {
      var span = makeEl('span', {}, node);
      span.textContent = char;
      if(idx == orpIdx) span.classList.add('orp');
    });

    node.center = (function(orpNode) {
      var val = orpNode.offsetLeft + (orpNode.offsetWidth / 2);
      node.style.left = "-" + val + "px";
    }).bind(null, node.children[orpIdx]);

    return node;
  };

  var disableKeyboardShortcuts;
  function showGUI(){
    blur();
    document.querySelector('.sq').style.display = 'block';
    disableKeyboardShortcuts = on('keydown', handleKeypress);
  };

  function hideGUI(){
    unblur();
    document.querySelector('.sq').style.display = 'none';
    disableKeyboardShortcuts && disableKeyboardShortcuts();
  };

  var keyHandlers = {
      32: dispatch.bind(null, 'squirt.play.toggle'),
      27: dispatch.bind(null, 'squirt.close'),
      38: dispatch.bind(null, 'squirt.speed.adjust', {value: 0.2}),
      40: dispatch.bind(null, 'squirt.speed.adjust', {value: -0.2}),
      37: dispatch.bind(null, 'squirt.rewind', {seconds: 2})
  };

  function handleKeypress(e){
    var handler = keyHandlers[e.keyCode];
    handler && (handler(), e.preventDefault())
    return false;
  };

  function blur(){
    map(document.body.children, function(node){
      if(!node.classList.contains('sq'))
        node.classList.add('sq-blur');
    });
  };

  function unblur(){
    map(document.body.children, function(node){
      node.classList.remove('sq-blur');
    });
  }

  function makeGUI(){
    var squirt = makeDiv({class: 'sq'}, document.body);
    squirt.style.display = 'none';
    on('squirt.close', hideGUI);
    var obscure = makeDiv({class: 'sq-obscure'}, squirt);
    on(obscure, 'click', function(){
      dispatch('squirt.close');
    });

    on(window, 'orientationchange', function(){
      Keen.addEvent('orientation-change', {'orientation': window.orientation});
    });

    var modal = makeDiv({'class': 'modal'}, squirt);

    var controls = makeDiv({'class':'controls'}, modal);
    var reader = makeDiv({'class': 'reader'}, modal);
    var wordContainer = makeDiv({'class': 'word-container'}, reader);
    makeDiv({'class': 'focus-indicator-gap'}, wordContainer);
    makeDiv({'class': 'word-prerenderer'}, wordContainer);
    makeDiv({'class': 'final-word'}, modal);
    var keyboard = makeDiv({'class': 'keyboard-shortcuts'}, reader);
    keyboard.innerText = "Keys: Space, Esc, Up, Down";

    (function make(controls){

      // this code is suffering from delirium
      (function makeSpeedSelect(){

        // create the ever-present left-hand side button
        var control = makeDiv({'class': 'sq speed sq control'}, controls);
        var speedLink = makeEl('a', {}, control);
        on('squirt.speed.after', function() {
          speedLink.textContent = 'x'+parseFloat(sq.speed).toFixed(1);
        });
        dispatch('squirt.speed.after');
        on(control, 'click', function(){
          toggle(speedSelector) ?
            dispatch('squirt.pause') :
            dispatch('squirt.play');
        });

        // create the custom selector
        var speedSelector = makeDiv({'class': 'sq speed-selector'}, controls);
        speedSelector.style.display = 'none';
        var plus50OptData = {add: 0, sign: "+"};
        var datas = [];
        for(var speed = 0.4; speed <= 2; speed += 0.2){
          var opt = makeDiv({'class': 'sq speed-option'}, speedSelector);
          var a = makeEl('a', {}, opt);
          a.data = { basespeed: speed };
          a.data.__proto__ = plus50OptData;
          datas.push(a.data);
          bind("{{speedLabel}}",  a.data, a);
          on(opt, 'click', function(e){
            dispatch('squirt.speed', {value: e.target.firstChild.data.speed});
            dispatch('squirt.play');
            speedSelector.style.display = 'none';
          });
        };

        // create the last option for the custom selector
        var plus50Opt = makeDiv({'class': 'sq speed-option sq speed-plus-50'}, speedSelector);
        var a = makeEl('a', {}, plus50Opt);
        bind("{{sign}}50", plus50OptData, a);
        on(plus50Opt, 'click', function(){
          datas.map(function(data){
            data.speed = data.basespeed + data.add;
            data.speedLabel = 'x'+parseFloat(data.speed).toFixed(1);
          });
          var toggle = plus50OptData.sign == '+';
          plus50OptData.sign = toggle ? '-' : '+';
          plus50OptData.add = toggle ? 0 : 50;
          dispatch('squirt.els.render');
        });
        dispatch('click', {}, plus50Opt);
      })();

      (function makeRewind(){
        var container = makeEl('div', {'class': 'sq rewind sq control'}, controls);
        var a = makeEl('a', {}, container);
        a.href = '#';
        on(container, 'click', function(e){
          dispatch('squirt.rewind', {seconds: 2});
          e.preventDefault();
        });
        a.innerHTML = "<i class='fa fa-backward'></i> 2s";
      })();

      (function makePause(){
        var container = makeEl('div', {'class': 'sq pause control'}, controls);
        var a = makeEl('a', {'href': '#'}, container);
        var pauseIcon = "<i class='fa fa-pause'></i>";
        var playIcon = "<i class='fa fa-play'></i>";
        function updateIcon(){
          a.innerHTML = sq.paused ? playIcon : pauseIcon;
        }
        on('squirt.pause.after', updateIcon);
        on(container, 'click', function(clickEvt){
          dispatch('squirt.play.toggle');
          clickEvt.preventDefault();
        });
        updateIcon();
      })();
    })(controls);
  };

  // utilites

  function map(listLike, f){
    listLike = Array.prototype.slice.call(listLike); // for safari
    return Array.prototype.map.call(listLike, f);
  }

  // invoke([f1, f2]); // calls f1() and f2()
  // invoke([o1, o2], 'func'); // calls o1.func(), o2.func()
  // args are applied to both invocation patterns
  function invoke(objs, funcName, args){
    args = args || [];
    var objsAreFuncs = false;
    switch(typeof funcName){
      case "object":
      args = funcName;
      break;
      case "undefined":
      objsAreFuncs = true;
    };
    return map(objs, function(o){
      return objsAreFuncs ? o.apply(null, args) : o[funcName].apply(o, args);
    });
  }

  function makeEl(type, attrs, parent) {
    var el = document.createElement(type);
    for(var k in attrs){
      if(!attrs.hasOwnProperty(k)) continue;
      el.setAttribute(k, attrs[k]);
    }
    parent && parent.appendChild(el);
    return el;
  };

  // data binding... *cough*
  function bind(expr, data, el){
    el.render = render.bind(null, expr, data, el);
    return on('squirt.els.render', function(){
      el.render();
    });
  };

  function render(expr, data, el){
    var match, rendered = expr;
    expr.match(/{{[^}]+}}/g).map(function(match){
      var val = data[match.substr(2, match.length - 4)];
      rendered = rendered.replace(match, val == undefined ? '' : val);
    });
    el.textContent = rendered;
  };

  function makeDiv(attrs, parent){
    return makeEl('div', attrs, parent);
  };

  function injectStylesheet(url, onLoad){
    var el = makeEl('link', {
      rel: 'stylesheet',
      href: url,
      type: 'text/css'
    }, document.head);
    function loadHandler(){
      onLoad();
      el.removeEventListener('load', loadHandler)
    };
    onLoad && on(el, 'load', loadHandler);
  };


  function on(bus, evts, cb){
    if(cb === undefined){
      cb = evts;
      evts = bus;
      bus = document;
    }
    evts = typeof evts == 'string' ? [evts] : evts;
    var removers = evts.map(function(evt){
      bus.addEventListener(evt, cb);
      return function(){
        bus.removeEventListener(evt, cb);
      };
    });
    if(removers.length == 1) return removers[0];
    return removers;
  };

  function dispatch(evt, attrs, dispatcher){
    var evt = new Event(evt);
    for(var k in attrs){
      if(!attrs.hasOwnProperty(k)) continue
      evt[k] = attrs[k];
    }
    (dispatcher || document).dispatchEvent(evt);
  };

  function toggle(el){
    var s = window.getComputedStyle(el);
    return (el.style.display = s.display == 'none' ? 'block' : 'none') == 'block';
  };

};

function injectKeen(){
  window.Keen=window.Keen||{configure:function(e){this._cf=e},addEvent:function(e,t,n,i){this._eq=this._eq||[],this._eq.push([e,t,n,i])},setGlobalProperties:function(e){this._gp=e},onChartsReady:function(e){this._ocrq=this._ocrq||[],this._ocrq.push(e)}};(function(){var e=document.createElement("script");e.type="text/javascript",e.async=!0,e.src=("https:"==document.location.protocol?"https://":"http://")+"cdnjs.cloudflare.com/ajax/libs/keen-js/5.0.5/keen.bundle.min.js";var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t)})();

  var Keen = window.Keen;
  var prod = {
      projectId: "531d7ffd36bf5a1ec4000000",
      writeKey: "9bdde746be9a9c7bca138171c98d6b7a4b4ce7f9c12dc62f0c3404ea8c7b5415a879151825b668a5682e0862374edaf46f7d6f25772f2fa6bc29aeef02310e8c376e89beffe7e3a4c5227a3aa7a40d8ce1dcde7cf28c7071b2b0e3c12f06b513c5f92fa5a9cfbc1bebaddaa7c595734d"
  };
  var dev = {
    projectId: "531aa8c136bf5a0f8e000003",
    writeKey: "a863509cd0ba1c7039d54e977520462be277d525f29e98798ae4742b963b22ede0234c467494a263bd6d6b064413c29cd984e90e6e6a4468d36fed1b04bcfce6f19f50853e37b45cb283b4d0dfc4c6e7a9a23148b1696d7ea2624f1c907abfac23a67bbbead623522552de3fedced628"
  };

  Keen.configure(sq.host.match('squirt.io') ? prod : dev);

  function addon(name, input, output){
    return { name: name, input: input, output: output};
  }

  function guid(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };

  Keen.setGlobalProperties(function(){
    var props = {
      source: "bookmarklet",
      userId: sq.userId || 'beta-user',
      href: window.location.href,
      rawUserAgent: "${keen.user_agent}",
      sessionId: 'sq-sesh-' + guid(),
      ip: "${keen.ip}",
      keen: { addons: [] },
      referrer: document.referrer,
      app_version: sq.version
    };
    var push = Array.prototype.push.bind(props.keen.addons);
    push(addon("keen:ip_to_geo", { ip: "ip" }, "geo"));
    push(addon("keen:ua_parser", { ua_string: "rawUserAgent" }, "userAgent"));
    return props;
  });

  return Keen;
};

export default function squirt() {
  var sq = window.sq;
  sq.version = '0.0.1';
  sq.host = document.scripts[document.scripts.length - 1].src.match(/\/\/.*\//)[0];
  launch(injectKeen());
};

