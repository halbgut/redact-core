Redact = Redact || {}

Redact.dragndrop = {
  follow: _.throttle(function (e) {
    this.node.style.transform = ['translate(', e.clientX, 'px, ', e.clientY, 'px)'].join('')
  }),
  starter: function (cb) {
    var self = this
    return function (e) {
      self.node = $(e.currentTarget).clone(1)[0]
      self.follower = self.follow.bind(self)
      self.node.className += ' redactDragging'
      document.body.appendChild(self.node)
      self.follower(e)
      window.addEventListener('mousemove', self.follower)
      self.stop = self.stopper(cb.bind(self))
      window.addEventListener('mouseup', self.stop)
    }
  },
  stopper: function (cb) {
    var self = this
    return function (e) {
      document.body.removeChild(self.node)
      if(cb) cb(e)
      window.removeEventListener('mouseup', self.stop)
    }
  }
}