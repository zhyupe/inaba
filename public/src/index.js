
(function () {
  if (typeof fetch !== 'function') {
    alert('Sorry, this page requires fetch API, but your browser does not support.')
    return
  }

  const $ = function (dom, selector) {
    if (!selector) {
      selector = dom
      dom = document
    }
    return dom.querySelectorAll(selector)
  }

  const $id = function (a) {
    return document.getElementById(a)
  }

  const $el = function (options) {
    var el, a
    if (!options.tagName) {
      el = document.createDocumentFragment()
    } else {
      el = document.createElement(options.tagName)
      if (options.className) {
        el.className = options.className
      }

      if (options.attributes) {
        for (a in options.attributes) {
          el.setAttribute(a, options.attributes[a])
        }
      }

      if (options.html !== undefined) {
        el.innerHTML = options.html
      }
    }

    if (options.text) {
      el.appendChild(document.createTextNode(options.text))
    }

    if (options.childs && options.childs.length) {
      for (let child of options.childs) {
        if (!child) continue
        el.appendChild(child instanceof window.HTMLElement ? child : $el(child))
      }
    }

    return el
  }

  const $form = function (form) {
    var config = {}
    var kvTemp = {}
    $(form, 'input, textarea, select').forEach(function (el) {
      if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) return

      var queryArr = el.name.split('.')
      var configObj
      if (el.getAttribute('mode') !== 'kv') {
        configObj = config
        while (queryArr.length > 1) {
          if (!configObj[queryArr[0]]) {
            configObj[queryArr[0]] = {}
          }
          configObj = configObj[queryArr[0]]
          queryArr.shift()
        }

        configObj[queryArr[0]] = el.value
      } else {
        if (!configObj[queryArr[0]]) {
          configObj[queryArr[0]] = {}
        }
        if (!kvTemp[queryArr[1]]) {
          kvTemp[queryArr[1]] = {}
        }
        configObj = kvTemp[queryArr[1]]
        configObj[queryArr[2]] = el.value

        if (configObj.k && configObj.v) {
          config[queryArr[0]][configObj.k] = configObj.v
        }
      }
    })
    return config
  }

  const $empty = function (el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild)
    }
  }

  const $show = el => { el.style.display = '' }
  const $hide = el => { el.style.display = 'none' }

  const param = function (a, parent) {
    var s = []
    var k, v

    for (k in a) {
      var key = encodeURIComponent(k)
      if (parent) {
        key = `${parent}[${key}]`
      }

      if (a[k] && typeof a[k] === 'object') {
        s = s.concat(param(a[k], key))
      } else {
        v = a[k]
        v = encodeURIComponent(typeof v === 'function' ? v() : v)
        s.push(`${key}=${v}`)
      }
    }

    return s.join('&')
  }

  const api = function (endpoint, params) {
    let uri = `/api/${endpoint}`
    if (params) {
      uri += `?${param(params)}`
    }
    return fetch(uri).then(res => {
      if (res.ok) {
        return res.json()
      } else {
        return res.text().then(text => Promise.reject(new Error(text)))
      }
    })
  }

  const stopPropagation = e => e.stopPropagation()

  let store = {}
  let $buttons = {
    go: $id('D_go'),
    back: $id('D_back'),
    refresh: $id('D_refresh')
  }
  let $auth = $id('D_authentication')
  let $backends = $id('D_backends')
  let $methods = $id('D_methods')

  const renderStatus = () => {
    let { status } = store
    $id('D_user').textContent = status.ip

    $($backends, '.active').forEach(el => el.classList.remove('active'))
    if (status.current) {
      $id(`D_backend_${status.current}`).classList.add('active')
    }
  }
  const renderBackend = () => {
    let { status } = store
    $empty($backends)
    if (status.backends && status.backends.length) {
      $show($backends)
      $backends.appendChild($el({
        tagName: 'li',
        className: 'title',
        childs: [$el({ tagName: 'h3', text: 'Authorized Backends' })]
      }))

      $backends.appendChild($el({
        tagName: 'li',
        className: 'item backend-wrap',
        childs: status.backends.map(backend => {
          let item = $el({
            tagName: 'a',
            className: 'backend',
            text: backend,
            attributes: {
              href: 'javascript:void(0)',
              id: `D_backend_${backend}`
            }
          })
          item.addEventListener('click', () => {
            api('select', { backend }).then(status => {
              store.status = status
              renderStatus()
            })
          })
          return item
        })
      }))
    } else {
      $hide($backends)
    }
  }
  const renderMethod = () => {
    let { auth } = store
    $empty($methods)
    let methods = Object.keys(auth)
    if (methods.length) {
      $show($methods)
      $methods.appendChild($el({
        tagName: 'li',
        className: 'title',
        childs: [$el({ tagName: 'h3', text: 'Available Methods' })]
      }))

      for (let method of methods) {
        let methodObj = auth[method]
        let item = $el({
          tagName: 'li',
          className: 'item',
          childs: [
            $el({ tagName: 'h4', text: methodObj.name }),
            $el({ tagName: 'p', text: methodObj.description || 'No description provided' }),
            $el({ tagName: 'span', className: 'item-go text-button', text: '>' })
          ]
        })
        item.addEventListener('click', () => {
          renderAuth(method, methodObj)
        })
        $methods.appendChild(item)
      }
    } else {
      $hide($methods)
    }
  }
  const renderAuth = (method, methodObj) => {
    store.method = method
    try {
      store.methodHistory = JSON.parse(localStorage.getItem(`inaba_auth_${method}`))
    } catch (e) {}

    if (!store.methodHistory || typeof store.methodHistory !== 'object') {
      store.methodHistory = {}
    }

    $show($buttons.go)
    $show($buttons.back)
    $hide($buttons.refresh)

    $hide($backends)
    $hide($methods)
    $show($auth)

    $empty($auth)
    $auth.appendChild($el({
      tagName: 'li',
      className: 'title',
      childs: [$el({ tagName: 'h3', text: `Auth - ${methodObj.name}` })]
    }))

    for (let field of methodObj.field) {
      let hasHistory = store.methodHistory[field]
      let id = `D_auth_${field}`
      let input = $el({
        tagName: 'input',
        attributes: {
          id,
          name: field
        }
      })
      if (hasHistory) {
        input.addEventListener('focus', () => {
          showHistory(id)
        })
      }
      let inputWrapper = $el({
        tagName: 'div',
        className: 'input',
        childs: [
          input,
          hasHistory && renderHistory(field)
        ]
      })
      inputWrapper.addEventListener('click', stopPropagation)
      $auth.appendChild($el({
        tagName: 'li',
        className: 'item',
        childs: [
          $el({
            tagName: 'label',
            text: field,
            attributes: {
              for: `D_auth_${field}`
            }
          }),
          inputWrapper
        ]
      }))
    }
  }

  let activeHistory = null
  const hideHistory = () => {
    if (activeHistory !== null) {
      $hide(activeHistory)
      activeHistory = null
    }
  }

  const showHistory = (id) => {
    hideHistory()
    activeHistory = $id(`${id}_history`)
    $show(activeHistory)
  }

  const renderHistory = field => $el({
    tagName: 'ul',
    className: 'history',
    attributes: {
      id: `D_auth_${field}_history`,
      style: 'display: none'
    },
    childs: store.methodHistory[field].map(history => {
      let item = $el({
        tagName: 'li',
        text: history
      })
      item.addEventListener('click', (e) => {
        let el = $id(`D_auth_${field}`)
        el.value = history
        hideHistory()
      })
      return item
    })
  })

  const renderMain = () => {
    $hide($buttons.go)
    $hide($buttons.back)
    $show($buttons.refresh)

    $hide($auth)
    renderBackend()
    renderMethod()
    renderStatus()
  }

  const refresh = () => {
    if (store.loading) return
    store.loading = true
    $buttons.refresh.classList.add('animate')

    Promise.all([api('status'), api('auth')]).then(([status, auth]) => {
      store = { status, auth }
      $buttons.refresh.classList.remove('animate')

      renderMain()
    }).catch(e => {
      store.loading = false
      $buttons.refresh.classList.remove('animate')
    })
  }

  document.body.addEventListener('click', hideHistory)
  $buttons.refresh.addEventListener('click', refresh)
  $buttons.back.addEventListener('click', renderMain)
  $buttons.go.addEventListener('click', () => {
    if (store.loading || !store.method) return
    store.loading = true
    let params = $form($auth)
    api(`auth/${store.method}`, params).then(status => {
      store.loading = false
      store.status = status

      console.log(store.methodHistory)
      Object.entries(params).forEach(([key, value]) => {
        if (!store.methodHistory[key]) {
          store.methodHistory[key] = [value]
        } else if (!store.methodHistory[key].includes(value)) {
          store.methodHistory[key].push(value)
        }
      })
      console.log(store.methodHistory)

      localStorage.setItem(`inaba_auth_${store.method}`, JSON.stringify(store.methodHistory))
      renderMain()

      console.log(store)
    }).catch(e => {
      store.loading = false
    })
  })

  refresh()
})()
