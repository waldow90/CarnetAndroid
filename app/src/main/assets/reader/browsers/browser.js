"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var initPath = "recentdb://";
var currentPath;
var currentTask = undefined;
var noteCardViewGrid = undefined;
var notePath = [];
var wasNewNote = false;
var dontOpen = false;
var currentNotePath = undefined;
var root_url = document.getElementById("root-url") != undefined ? document.getElementById("root-url").innerHTML : "";
new RequestBuilder();
/*const {
    ipcRenderer,
    remote,
    app
} = require('electron');*/

var store = new Store();
var noteCacheStr = String(store.get("note_cache"));
if (noteCacheStr == "undefined") noteCacheStr = "{}";
console.log("cache loaded ");
var oldNotes = JSON.parse(noteCacheStr);
/*var main = remote.require("./main.js");
var SettingsHelper = require("./settings/settings_helper").SettingsHelper
var settingsHelper = new SettingsHelper()*/

var TextGetterTask = function TextGetterTask(list) {
  this.list = list;
  this.current = 0;
  this.continue = true;
  this.stopAt = 50;
};

TextGetterTask.prototype.startList = function () {
  this.getNext();
};

TextGetterTask.prototype.getNext = function () {
  console.log(this.current);

  if (this.current >= this.stopAt || this.current >= this.list.length) {
    console.log("save cache ");
    store.set("note_cache", JSON.stringify(oldNotes));
    return;
  }

  var paths = "";
  var start = this.current;

  for (var i = start; i < this.stopAt && i < this.list.length && i - start < 10; i++) {
    //do it ten by ten
    this.current = i + 1;
    if (!(this.list[i] instanceof Note)) continue;
    paths += this.list[i].path + ",";
    if (oldNotes[this.list[i].path] == undefined) oldNotes[this.list[i].path] = this.list[i];
  }

  var myTask = this;
  RequestBuilder.sRequestBuilder.get("/metadata?paths=" + encodeURIComponent(paths), function (error, data) {
    console.log("data " + data);

    for (var meta in data) {
      console.log("current path " + meta);
      oldNotes[meta].metadata = data[meta].metadata != undefined ? data[meta].metadata : new NoteMetadata();
      oldNotes[meta].text = data[meta].shorttext;
      oldNotes[meta].previews = data[meta].previews;
      noteCardViewGrid.updateNote(oldNotes[meta]);
      noteCardViewGrid.msnry.layout();
    }

    myTask.getNext();
  });
};

String.prototype.replaceAll = function (search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

function openNote(notePath) {
  currentNotePath = notePath;
  RequestBuilder.sRequestBuilder.get("/note/open/prepare", function (error, data) {
    console.log("opening " + data);
    if (error) return;

    if (writerFrame.src == "") {
      if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && navigator.userAgent.toLowerCase().indexOf("android") > -1) {
        //open in new tab for firefox android
        window.open("writer?path=" + encodeURIComponent(notePath), "_blank");
      } else {
        writerFrame.src = data + "?path=" + encodeURIComponent(notePath);
        writerFrame.style.display = "inline-flex";
        loadingView.style.display = "block";
      }

      setTimeout(function () {
        writerFrame.openDevTools();
      }, 1000);
    } else {
      console.log("reuse old iframe");
      if (compatibility.isElectron) writerFrame.send('loadnote', notePath);else writerFrame.contentWindow.loadPath(notePath);
      writerFrame.style.display = "inline-flex";
      loadingView.style.display = "block";
    }
  }); //window.location.assign("writer?path=" + encodeURIComponent(notePath));
}

function oldOpenNote(notePath) {
  currentNotePath = notePath;

  var electron = require('electron');

  var remote = electron.remote;
  var BrowserWindow = remote.BrowserWindow;

  var path = require('path'); //var win = new BrowserWindow({ width: 800, height: 600 });


  if (!hasLoadedOnce) $(loadingView).fadeIn(); //$(browserElem).faceOut();

  var rimraf = require('rimraf');

  var tmp = path.join(main.getPath("temp"), "tmpquicknote");
  rimraf(tmp, function () {
    var fs = require('fs');

    fs.mkdir(tmp, function (e) {
      fs.readFile(__dirname + '/reader/reader.html', 'utf8', function (err, data) {
        if (err) {
          fs.rea;
          console.log("error ");
          return console.log(err);
        }

        var index = path.join(tmp, 'reader.html');
        fs.writeFileSync(index, data.replace(new RegExp('<!ROOTPATH>', 'g'), __dirname + '/'));
        /* var size = remote.getCurrentWindow().getSize();
         var pos = remote.getCurrentWindow().getPosition();
         var win = new BrowserWindow({
             width: size[0],
             height: size[1],
             x: pos[0],
             y: pos[1],
             frame: false
         });
         console.log("w " + remote.getCurrentWindow().getPosition()[0])
         const url = require('url')
         win.loadURL(url.format({
             pathname: path.join(__dirname, 'tmp/reader.html'),
             protocol: 'file:',
             query: {
                 'path': notePath
             },
             slashes: true
         }))*/

        var url = require('url');

        if (!hasLoadedOnce) {
          webview.setAttribute("src", url.format({
            pathname: index,
            protocol: 'file:',
            query: {
              'path': notePath,
              'tmppath': tmp + "/"
            },
            slashes: true
          }));
        } else webview.send('loadnote', notePath);

        webview.style = "position:fixed; top:0px; left:0px; height:100%; width:100%; z-index:100; right:0; bottom:0;"; //to resize properly

        hasLoadedOnce = true;
      });
    });
  });
}

function onDragEnd(gg) {
  console.log("ondragend");
  dontOpen = true;
}

function refreshKeywords() {
  var keywordsDBManager = new KeywordsDBManager();
  keywordsDBManager.getFlatenDB(function (error, data) {
    var keywordsContainer = document.getElementById("keywords");
    keywordsContainer.innerHTML = "";
    var dataArray = [];

    for (var key in data) {
      if (data[key].length == 0) continue;
      dataArray.push(key);
    }

    dataArray.sort(Utils.caseInsensitiveSrt);

    var _loop = function _loop() {
      var key = dataArray[_i];
      keywordElem = document.createElement("a");
      keywordElem.classList.add("mdl-navigation__link");
      keywordElem.innerHTML = key;
      keywordElem.setAttribute("href", "");

      keywordElem.onclick = function () {
        toggleDrawer();
        list("keyword://" + key, false);
        return false;
      };

      keywordsContainer.appendChild(keywordElem);
    };

    for (var _i = 0; _i < dataArray.length; _i++) {
      var keywordElem;

      _loop();
    }
  });
}

function searchInNotes(searching) {
  resetGrid(false);
  notes = [];
  RequestBuilder.sRequestBuilder.get("/notes/search?path=." + "&query=" + encodeURIComponent(searching), function (error, data) {
    if (!error) {
      list("search://", true);
    }
  });
}

function resetGrid(discret) {
  var grid = document.getElementById("page-content");
  var scroll = 0;
  if (discret) scroll = document.getElementById("grid-container").scrollTop;
  grid.innerHTML = "";
  noteCardViewGrid = new NoteCardViewGrid(grid, discret, onDragEnd);
  this.noteCardViewGrid = noteCardViewGrid;
  noteCardViewGrid.onFolderClick(function (folder) {
    list(folder.path);
  });
  noteCardViewGrid.onNoteClick(function (note) {
    if (!dontOpen) openNote(note.path);
    dontOpen = false; // var reader = new Writer(note,"");
    // reader.extractNote()
  });
  noteCardViewGrid.onMenuClick(function (note) {
    mNoteContextualDialog.show(note);
  });
}

var ContextualDialog =
/*#__PURE__*/
function () {
  function ContextualDialog() {
    _classCallCheck(this, ContextualDialog);

    this.showDelete = true;
    this.showArchive = true;
    this.showPin = true;
    this.dialog = document.querySelector('#contextual-dialog');
    this.nameInput = this.dialog.querySelector('#name-input');
    this.deleteButton = this.dialog.querySelector('.delete-button');
    this.archiveButton = this.dialog.querySelector('#archive-button');
    this.pinButton = this.dialog.querySelector('#pin-button');
    this.cancel = this.dialog.querySelector('.cancel');
    this.ok = this.dialog.querySelector('.ok');
    var context = this;

    this.cancel.onclick = function () {
      context.dialog.close();
    };
  }

  _createClass(ContextualDialog, [{
    key: "show",
    value: function show() {
      this.showDelete ? $(this.deleteButton).show() : $(this.deleteButton).hide();
      this.showArchive ? $(this.archiveButton).show() : $(this.archiveButton).hide();
      this.showPin ? $(this.pinButton).show() : $(this.pinButton).hide();
      this.dialog.showModal();
      this.nameInput.focus();
    }
  }]);

  return ContextualDialog;
}();

var NewFolderDialog =
/*#__PURE__*/
function (_ContextualDialog) {
  _inherits(NewFolderDialog, _ContextualDialog);

  function NewFolderDialog() {
    var _this;

    _classCallCheck(this, NewFolderDialog);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(NewFolderDialog).call(this));
    _this.showDelete = false;
    _this.showArchive = false;
    _this.showPin = false;
    return _this;
  }

  _createClass(NewFolderDialog, [{
    key: "show",
    value: function show() {
      var context = this;

      this.ok.onclick = function () {
        RequestBuilder.sRequestBuilder.post("/browser/newfolder", {
          path: currentPath + "/" + context.nameInput.value
        }, function (error) {
          if (error) {}

          list(currentPath, true);
          context.dialog.close();
        });
      };

      _get(_getPrototypeOf(NewFolderDialog.prototype), "show", this).call(this);
    }
  }]);

  return NewFolderDialog;
}(ContextualDialog);

var NoteContextualDialog =
/*#__PURE__*/
function (_ContextualDialog2) {
  _inherits(NoteContextualDialog, _ContextualDialog2);

  function NoteContextualDialog() {
    _classCallCheck(this, NoteContextualDialog);

    return _possibleConstructorReturn(this, _getPrototypeOf(NoteContextualDialog).call(this));
  }

  _createClass(NoteContextualDialog, [{
    key: "show",
    value: function show(note) {
      var context = this;
      this.nameInput.value = note.title;

      this.deleteButton.onclick = function () {
        var db = new RecentDBManager();
        context.dialog.close();
        db.removeFromDB(note.path, function (error, data) {
          if (!error) RequestBuilder.sRequestBuilder.delete("/notes?path=" + encodeURIComponent(note.path), function () {
            list(currentPath, true);
          });
        });
      };

      this.archiveButton.onclick = function () {
        var db = new RecentDBManager();
        db.removeFromDB(note.path, function () {
          context.dialog.close();
          list(currentPath, true);
        });
      };

      if (note.isPinned == true) {
        this.pinButton.innerHTML = "Unpin";
      } else this.pinButton.innerHTML = "Pin";

      this.pinButton.onclick = function () {
        var db = new RecentDBManager();
        if (note.isPinned == true) db.unpin(note.path, function () {
          context.dialog.close();
          list(currentPath, true);
        });else db.pin(note.path, function () {
          context.dialog.close();
          list(currentPath, true);
        });
      };

      this.ok.onclick = function () {
        var path = FileUtils.getParentFolderFromPath(note.path);
        var hasOrigin = false;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = context.nameInput.value.split("/")[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var part = _step.value;

            if (part == ".." && !hasOrigin) {
              path = FileUtils.getParentFolderFromPath(path);
            } else {
              hasOrigin = true;
              path += "/" + part;
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        RequestBuilder.sRequestBuilder.post("/notes/move", {
          from: note.path,
          to: path + ".sqd"
        }, function () {
          list(currentPath, true);
        });
        context.dialog.close();
      };

      _get(_getPrototypeOf(NoteContextualDialog.prototype), "show", this).call(this);
    }
  }]);

  return NoteContextualDialog;
}(ContextualDialog);

var mNoteContextualDialog = new NoteContextualDialog();
var mNewFolderDialog = new NewFolderDialog();

function list(pathToList, discret) {
  if (pathToList == undefined) pathToList = currentPath;
  console.log("listing path " + pathToList);
  currentPath = pathToList;
  var settingsHelper = {};

  settingsHelper.getNotePath = function () {
    return "pet";
  };

  if (pathToList == settingsHelper.getNotePath() || pathToList == initPath || pathToList.startsWith("keyword://")) {
    if (pathToList != settingsHelper.getNotePath()) {
      $("#add-directory-button").hide();
    } else $("#add-directory-button").show();

    $("#back_arrow").hide();
  } else {
    $("#back_arrow").show();
    $("#add-directory-button").show();
  }

  var fb = new FileBrowser(pathToList);
  fb.list(function (files, endOfSearch) {
    resetGrid(discret);
    var noteCardViewGrid = this.noteCardViewGrid;
    var notes = [];
    notePath = [];
    if (currentTask != undefined) currentTask.continue = false;

    if (files.length > 0) {
      $("#emty-view").fadeOut("fast");
    } else if (endOfSearch) $("#emty-view").fadeIn("fast");

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = files[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var file = _step2.value;
        var filename = getFilenameFromPath(file.path);

        if (file.isFile && filename.endsWith(".sqd")) {
          var oldNote = oldNotes[file.path];
          var noteTestTxt = new Note(stripExtensionFromName(filename), oldNote != undefined ? oldNote.text : "", file.path, oldNote != undefined ? oldNote.metadata : undefined, oldNote != undefined ? oldNote.previews : undefined);
          noteTestTxt.isPinned = file.isPinned;
          notes.push(noteTestTxt);
        } else if (!file.isFile) {
          notes.push(file);
        }

        notePath.push(file.path);
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    noteCardViewGrid.setNotesAndFolders(notes);

    if (discret) {
      document.getElementById("grid-container").scrollTop = scroll;
      console.log("scroll : " + scroll);
    }

    currentTask = new TextGetterTask(notes);
    console.log("stopping and starting task");
    currentTask.startList();

    if (!endOfSearch) {
      setTimeout(function () {
        list(pathToList, true);
      }, 1000);
    }
  });
}

list(initPath);
refreshKeywords();

function minimize() {
  remote.BrowserWindow.getFocusedWindow().minimize();
}

function maximize() {
  if (remote.BrowserWindow.getFocusedWindow().isMaximized()) remote.BrowserWindow.getFocusedWindow().unmaximize();else remote.BrowserWindow.getFocusedWindow().maximize();
}

function closeW() {
  remote.app.exit(0);
  console.log("cloose");
}

function toggleSearch() {
  $("#search-container").slideToggle();
  if ($("#search-container").css("display") != "none") $("#search-input").focus();
}
/*main.setMergeListener(function () {
    list(initPath, true)
})*/


document.getElementById("add-note-button").onclick = function () {
  var path = currentPath;
  if (path == initPath || path.startsWith("keyword://")) path = "";
  RequestBuilder.sRequestBuilder.get("/note/create?path=" + encodeURIComponent(path), function (error, data) {
    if (error) return;
    console.log("found " + data);
    wasNewNote = true;
    var db = new RecentDBManager();
    db.addToDB(data, function () {
      openNote(data);
    });
  });
  /*new NewNoteCreationTask(function (path) {
      console.log("found " + path)
      wasNewNote = true;
      var db = new RecentDBManager(main.getNotePath() + "/quickdoc/recentdb/" + main.getAppUid())
      db.addToDB(NoteUtils.getNoteRelativePath(main.getNotePath(), path));
      openNote(path)
  })*/
};

document.getElementById("add-directory-button").onclick = function () {
  mNewFolderDialog.show();
};

document.getElementById("search-input").onkeydown = function (event) {
  if (event.key === 'Enter') {
    toggleSearch();
    searchInNotes(this.value);
  }
};

document.getElementById("back_arrow").addEventListener("click", function () {
  list(FileUtils.getParentFolderFromPath(currentPath));
});

function getNotePath() {
  return main.getNotePath();
}

function loadNextNotes() {
  browser.noteCardViewGrid.addNext(15);
  currentTask.stopAt += 15;
  currentTask.getNext();
}

var browser = void 0;

document.getElementById("grid-container").onscroll = function () {
  if (this.offsetHeight + this.scrollTop >= this.scrollHeight - 80) {
    loadNextNotes();
  }
};

var hasLoadedOnce = false;
var loadingView = document.getElementById("loading-view"); //var browserElem = document.getElementById("browser")

console.log("pet");
var dias = document.getElementsByClassName("mdl-dialog");

for (var i = 0; i < dias.length; i++) {
  dialogPolyfill.registerDialog(dias[i]);
}

document.getElementById("search-button").onclick = function () {
  toggleSearch();
}; //nav buttons


document.getElementById("browser-button").onclick = function () {
  toggleDrawer();
  list("/");
  return false;
};

document.getElementById("recent-button").onclick = function () {
  toggleDrawer();
  list("recentdb://");
  return false;
};

function toggleDrawer() {
  if (document.getElementsByClassName("is-small-screen").length > 0) document.getElementsByClassName("mdl-layout__drawer-button")[0].click();
}

function isFullScreen() {
  return document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
}

RequestBuilder.sRequestBuilder.get("/recentdb/merge", function (error, data) {
  if (data == true && currentPath == "recentdb://") list("recentdb://", true);
});
RequestBuilder.sRequestBuilder.get("/keywordsdb/merge", function (error, data) {
  if (data == true) refreshKeywords();
});
var isWeb = true;
var right = document.getElementById("right-bar"); //writer frame

var isElectron = typeof require === "function";
var writerFrame = undefined;
events = [];

if (isElectron) {
  writerFrame = document.getElementById("writer-webview");
  writerFrame.addEventListener('ipc-message', function (event) {
    if (events[event.channel] !== undefined) {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = events[event.channel][Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var callback = _step3.value;
          callback();
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  });
} else {
  writerFrame = document.getElementById("writer-iframe"); //iframe events

  var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  var eventer = window[eventMethod];
  var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
  eventer(messageEvent, function (e) {
    if (events[e.data] !== undefined) {
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = events[e.data][Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var callback = _step4.value;
          callback();
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  });
}

function registerWriterEvent(event, callback) {
  if (events[event] == null) {
    events[event] = [];
  }

  events[event].push(callback);
}

registerWriterEvent("exit", function () {
  writerFrame.style.display = "none";
  $("#no-drag-bar").hide();
  if (wasNewNote) list();else {
    if (currentTask != undefined) {
      var index = notePath.indexOf(currentNotePath);
      currentTask.current = index;
      currentTask.stopAt = index + 1;
      currentTask.startList();
    }
  }
});
registerWriterEvent("loaded", function () {
  loadingView.style.display = "none";
  $("#no-drag-bar").show();
});
setTimeout(function () {
  RequestBuilder.sRequestBuilder.get("/settings/isfirstrun", function (error, data) {
    if (!error && data == true) {
      var elem = document.getElementById("firstrun-container");
      $(elem).show();
      $("#firstrun").slideToggle();
      new Slides(elem, function () {
        $("#firstrun").slideToggle(function () {
          $(elem).hide();
        });
      });
    }
  });
}, 2000);
initDragAreas();