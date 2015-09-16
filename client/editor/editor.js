var currentDoc
var templateInstance

Template.redactEditor.helpers({
  getDocument: function () {
    currentDoc = typeof this.doc === 'string'
      ? Redact.collection.findOne(this.doc)
      : this.doc
    return currentDoc
  },
  getTemplate: function () {
    if(!this._type) throw new Meteor.Error('invalidElement', '_type of element is not defined: ' + EJSON.stringify(this))
    return Redact.modules[this._type].template
  },
  shouldBeContenteditable: function (field) {
    return (field._lock && field._lock._user === Redact.getUserId()) || !field._lock
  },
  modules: function () {
    return _.map(Redact.modules, function (elem, key) {
      return _.extend(elem, { name: key })
    })
  },
  getElements: function () {
    return this._draft.map(function (elem, index) {
      return _.extend(elem, {
        fieldId: ['_draft', index].join('.')
      })
    })
  },
  getField: function (key) {
    return Redact.objValMongoSelector(Redact.collection.findOne(currentDoc._id, {reactive: false}), key)
  }
})

Template.redactEditor.onRendered(renderPartlyReactiveContent)

Template.redactEditor.events({
  'focus [contenteditable=true]': contentGetter(Redact.lockField),
  'keyup [contenteditable=true]': contentGetter(_.throttle(Redact.updateFieldValue, 1000)),
  'blur [contenteditable=true]': contentGetter(Redact.updateFieldValue),
  'mousedown .redactEditor__module': Redact.dragndrop.starter(function (e) {
    var module = this.node.getAttribute('data-type')
    Redact.addElement(
      currentDoc._id,
      '_draft',
      0,
      _.extend({
        _html: '',
        _type: module
      }, (Redact.modules[module].defaults || {})),
      renderPartlyReactiveContent
    )
  })
})

function contentGetter (cb) {
  return function (e) {
    if(!e.currentTarget.getAttribute('data-field'))
      throw 'All contenteditables need a data-field attribute.'
    cb(currentDoc._id, e.currentTarget.getAttribute('data-field'), e.currentTarget.innerHTML, e.currentTarget)
  }
}

function renderPartlyReactiveContent () {
  templateInstance = templateInstance || this
  templateInstance.$('[data-field]').each(function (i, elem) {
    elem.innerHTML = Redact.objValMongoSelector(currentDoc, elem.getAttribute('data-field'))._html
  })
  templateInstance.$('[contenteditable=true]').each(function (i, elem) {
    var field = elem.getAttribute('data-field')
    Tracker.autorun(function () {
      var lock = Redact.collection.findOne(currentDoc._id)[field + '.lock']
      if((lock && lock._user === Redact.getUserId()) || !lock) {
        elem.contenteditable = 'true'
      } else {
        elem.contenteditable = 'false'
      }
    })
  })
}
