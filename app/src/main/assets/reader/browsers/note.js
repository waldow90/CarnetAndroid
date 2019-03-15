var Note = function Note(title, text, path, metadata, previews) {
  this.title = title;
  this.text = text;
  this.path = path;
  this.previews = previews;

  if (metadata == undefined) {
    this.metadata = new NoteMetadata();
    this.metadata.creation_date = Date.now();
    this.metadata.last_modification_date = this.metadata.creation_date;
  } else this.metadata = metadata;
};

var NoteMetadata = function NoteMetadata() {
  this.creation_date = "";
  this.last_modification_date = "";
  this.keywords = [];
  this.rating = -1;
  this.color = "none";
};

if (typeof exports !== 'undefined') exports.Note = Note;