'use strict';

angular.module('ngCaret', []).factory('EditableCaret', function (CaretUtils) {
  'use strict';

  return {
    range: function range() {
      var sel;

      if (!window.getSelection) {
        return;
      }
      sel = window.getSelection();
      if (sel.rangeCount > 0) {
        return sel.getRangeAt(0);
      } else {
        return null;
      }
    },

    getPos: function getPos(element) {
      var clonedRange, pos, range;
      range = this.range();
      if (range) {
        clonedRange = range.cloneRange();
        clonedRange.selectNodeContents(element[0]);
        clonedRange.setEnd(range.endContainer, range.endOffset);
        pos = clonedRange.toString().length;
        return pos;
      } else if (document.selection) {
        return this.getOldIEPos(element);
      }
    },

    getOldIEPos: function getOldIEPos(element) {
      var preCaretTextRange, textRange;

      textRange = document.selection.createRange();
      preCaretTextRange = document.body.createTextRange();
      preCaretTextRange.moveToElementText(element[0]);
      preCaretTextRange.setEndPoint('EndToEnd', textRange);
      return preCaretTextRange.text.length;
    },

    setPos: function setPos(element) {
      return element[0];
    },

    getOffset: function getOffset(element) {
      var clonedRange, offset, range, rect;

      offset = null;
      range = this.range();
      if (window.getSelection && range) {
        clonedRange = range.cloneRange();
        clonedRange.setStart(range.endContainer, Math.max(1, range.endOffset) - 1);
        clonedRange.setEnd(range.endContainer, range.endOffset);
        rect = clonedRange.getBoundingClientRect();
        offset = {
          height: rect.height,
          left: rect.left + rect.width,
          top: rect.top
        };
      } else if (document.selection) {
        this.getOldIEOffset();
      }
      return CaretUtils.adjustOffset(offset, element);
    },

    getOldIEOffset: function getOldIEOffset() {
      var range, rect;

      range = document.selection.createRange().duplicate();
      range.moveStart('character', -1);
      rect = range.getBoundingClientRect();
      return {
        height: rect.bottom - rect.top,
        left: rect.left,
        top: rect.top
      };
    }
  };
}).factory('InputCaret', function (Mirror, CaretUtils) {
  'use strict';

  return {
    getPos: function getPos(element) {
      if (document.selection) {
        return this.getIEPos(element);
      } else {
        return element[0].selectionStart;
      }
    },

    getIEPos: function getIEPos(element) {
      var endRange, inputor, len, normalizedValue, pos, range, textInputRange;

      inputor = element[0];
      range = document.selection.createRange();
      pos = 0;
      if (range && range.parentElement() === inputor) {
        normalizedValue = inputor.value.replace(/\r\n/g, '\n');
        len = normalizedValue.length;
        textInputRange = inputor.createTextRange();
        textInputRange.moveToBookmark(range.getBookmark());
        endRange = inputor.createTextRange();
        endRange.collapse(false);
        if (textInputRange.compareEndPoints('StartToEnd', endRange) > -1) {
          pos = len;
        } else {
          pos = -textInputRange.moveStart('character', -len);
        }
      }
      return pos;
    },

    setPos: function setPos(element, pos) {
      var inputor, range;

      inputor = element[0];
      if (document.selection) {
        range = inputor.createTextRange();
        range.move('character', pos);
        range.select();
      } else if (inputor.setSelectionRange) {
        inputor.setSelectionRange(pos, pos);
      }
      return inputor;
    },

    getPosition: function getPosition(element, pos) {
      var inputor, atRect, format, h, html, startRange, x, y;

      inputor = element;
      format = function (value) {
        return value.replace(/</g, '&lt').replace(/>/g, '&gt').replace(/`/g, '&#96').replace(/'/g, '&quot').replace(/\r\n|\r|\n/g, '<br />');
      };
      if (angular.isUndefined(pos)) {
        pos = this.getPos(inputor);
      }
      startRange = inputor.val().slice(0, pos);
      html = '<span>' + format(startRange) + '</span>';
      html += '<span id="caret">|</span>';
      atRect = Mirror.create(inputor, html).rect();
      x = atRect.left - inputor[0].scrollLeft;
      y = atRect.top - inputor[0].scrollTop;
      h = atRect.height;
      return {
        left: x,
        top: y,
        height: h
      };
    },

    getOffset: function getOffset(element, pos) {
      var inputor, offset, position;

      inputor = element;
      if (document.selection) {
        return CaretUtils.adjustOffset(this.getIEOffset(inputor, pos), inputor);
      } else {
        offset = inputor.offset();
        position = this.getPosition(element, pos);
        offset = {
          left: offset.left + position.left,
          top: offset.top + position.top,
          height: position.height
        };
        return offset;
      }
    },

    getIEOffset: function getIEOffset(element, pos) {
      var h, range, textRange, x, y;

      textRange = element[0].createTextRange();
      if (pos) {
        textRange.move('character', pos);
      } else {
        range = document.selection.createRange();
        textRange.moveToBookmark(range.getBookmark());
      }
      x = textRange.boundingLeft;
      y = textRange.boundingTop;
      h = textRange.boundingHeight;
      return {
        left: x,
        top: y,
        height: h
      };
    }
  };
}).factory('Mirror', function () {
  'use strict';

  var cssAttr = ['overflowY', 'height', 'width', 'paddingTop', 'paddingLeft', 'paddingRight', 'paddingBottom', 'marginTop', 'marginLeft', 'marginRight', 'marginBottom', 'fontFamily', 'borderStyle', 'borderWidth', 'wordWrap', 'fontSize', 'lineHeight', 'overflowX', 'text-align'];

  return {
    mirrorCss: function mirrorCss(element) {
      var css = {
        position: 'absolute',
        left: -9999,
        top: 0,
        zIndex: -20000,
        'white-space': 'pre-wrap'
      };
      angular.forEach(cssAttr, function (value) {
        css[value] = element.css(value);
      });
      return css;
    },

    create: function create(element, html) {
      this.mirror = angular.element('<div></div>');
      this.mirror.css(this.mirrorCss(element));
      this.mirror.html(html);
      element.after(this.mirror);
      return this;
    },

    rect: function rect() {
      var flag, pos, rect;

      flag = this.mirror.find('#caret');
      pos = flag.position();
      rect = {
        left: pos.left,
        top: pos.top,
        height: flag.height()
      };
      this.mirror.remove();
      return rect;
    }
  };
}).factory('CaretUtils', function () {
  'use strict';

  return {
    adjustOffset: function adjustOffset(offset, inputor) {
      if (!offset) {
        return;
      }
      offset.top += window.scrollY + inputor[0].scrollTop;
      offset.left += +window.scrollX + inputor[0].scrollLeft;
      return offset;
    },
    contentEditable: function contentEditable(inputor) {
      return !!(inputor[0].contentEditable && inputor[0].contentEditable === 'true');
    }
  };
}).factory('Caret', function (InputCaret, EditableCaret) {
  'use strict';
  return {
    getPos: function getPos(element) {
      var attr = element.attr('contenteditable');
      if (typeof attr === 'string') {
        return EditableCaret.getPos(element);
      } else {
        return InputCaret.getPos(element);
      }
    },

    setPos: function setPos(element, pos) {
      if (element.attr('contenteditable') === 'true') {
        return EditableCaret.setPos(element, pos);
      } else {
        return InputCaret.setPos(element, pos);
      }
    },

    getOffset: function getOffset(element) {
      if (element.attr('contenteditable') === 'true') {
        return EditableCaret.getOffset(element);
      } else {
        return InputCaret.getOffset(element);
      }
    }
  };
});
'use strict';

angular.module('ngAt', ['ngCaret']).factory('AtUtils', function () {
  'use strict';

  var range = null;

  return {
    markRange: function markRange() {
      range = this.getRange() || this.getIERange();
      return range;
    },

    getRange: function getRange() {
      return window.getSelection ? window.getSelection().getRangeAt(0) : undefined;
    },

    getIERange: function getIERange() {
      return document.selection ? document.selection.createRange() : undefined;
    },

    getContent: function getContent(element) {
      var attr = element.attr('contenteditable');
      if (typeof attr === 'string') {
        return element.text();
      } else {
        return element.val();
      }
    },

    query: function query(subtext, flag) {
      var regexp, match;

      regexp = new RegExp(flag + '([A-Za-z0-9_\\+\\-]*)$|' + flag + '([^\\x00-\\xff]*)$', 'gi');
      match = regexp.exec(subtext);

      if (match) {
        return match[2] || match[1];
      } else {
        return null;
      }
    },

    insert: function insert(element, content, data, query, range) {
      var insertNode, pos, sel, source, startStr, text;
      if (element.attr('contenteditable') === 'true') {
        insertNode = angular.element('<span contenteditable="false">@' + data + '&nbsp;</span>');

        if (window.getSelection) {
          pos = range.startOffset - (query.endPos - query.headPos) - 1;
          range.setStart(range.endContainer, Math.max(pos, 0));
          range.setEnd(range.endContainer, range.endOffset);
          range.deleteContents();
          range.insertNode(insertNode[0]);
          range.collapse(false);
          sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } else if (document.selection) {
          range.moveStart('character', query.endPos - query.headPos - 1);
          range.pasteHTML(insertNode[0]);
          range.collapse(false);
          range.select();
        }
      } else {
        source = element.val();
        startStr = source.slice(0, Math.max(query.headPos - 1, 0));
        text = startStr + '@' + data + ' ' + source.slice(query.endPos || 0);
        element.val(text);
      }
    },

    select: {
      prev: function prev(cur, lists) {
        var prev;

        cur.removeClass('list-cur');
        prev = cur.prev();
        if (!prev.length) {
          prev = lists.last();
        }
        return prev.addClass('list-cur');
      },

      next: function next(cur, lists) {
        var next;

        cur.removeClass('list-cur');
        next = cur.next();
        if (!next.length) {
          next = lists.first();
        }

        return next.addClass('list-cur');
      },

      choose: function choose(cur) {
        var content;

        cur.removeClass('list-cur');
        content = cur.find('span').text();

        return content;
      }
    }
  };
}).directive('atUser', function ($http, $timeout, Caret, AtUtils) {
  'use strict';

  return {
    restrict: 'A',
    link: function link(scope, element, attrs) {
      var subtext, caretOffset;
      var flag = attrs.flag || '@';
      var lineHeight = scope.lineHeight || 16;
      scope.isAtListHidden = true;

      scope.$watch('caretPos', function (nowCaretPos) {

        if (angular.isDefined(nowCaretPos)) {
          scope.content = AtUtils.getContent(element);
          subtext = scope.content.slice(0, nowCaretPos);
          scope.query = AtUtils.query(subtext, flag);
          caretOffset = Caret.getOffset(element);

          console.log("scope.query: ", scope.query);

          if (scope.query === null) {
            scope.isAtListHidden = true;
          }

          if (angular.isString(scope.query) && scope.query.length <= 10) {
            if (scope.query === '' && element.next().attr('auto-follow') === 'true') {
              element.next().find('ul').css({
                left: caretOffset.left,
                top: caretOffset.top + lineHeight
              });
            }
            scope.query = {
              'text': scope.query,
              'headPos': nowCaretPos - scope.query.length,
              'endPos': nowCaretPos
            };
          }

          if (angular.isObject(scope.query)) {
            scope.users = scope.response;
            scope.isAtListHidden = false;
          }
        }
      });

      element.bind('blur', function () {
        scope.isAtListHidden = true;
      });

      element.bind('click touch keyup', function () {
        scope.$apply(function () {
          scope.caretPos = Caret.getPos(element);
        });
      });
    }
  };
}).directive('autoComplete', function (Caret, AtUtils) {
  'use strict';

  return {
    restrict: 'A',
    link: function link(scope, element) {
      var range;
      var span = element.next();
      var keyCode = {
        up: 38,
        down: 40,
        enter: 13
      };

      scope.autoComplete = function (object) {
        element[0].focus();
        AtUtils.insert(element, scope.content, object.username, scope.query, range);
        Caret.setPos(element, scope.query.headPos + object.username.length + 1);
      };

      span.bind('mouseenter', function () {
        var lists = span.find('li');
        range = AtUtils.markRange();
        lists.removeClass('list-cur');
      });

      element.bind('keydown', function (e) {
        var ul = $(e.currentTarget).next().find('ul');
        var lists = ul.find('li');
        var cur = ul.children('.list-cur');
        if (scope.isAtListHidden === false) {

          switch (e.keyCode) {

            case keyCode.up:
              e.originalEvent.preventDefault();
              AtUtils.select.prev(cur, lists);
              break;

            case keyCode.down:
              e.originalEvent.preventDefault();
              AtUtils.select.next(cur, lists);
              break;

            case keyCode.enter:
              e.originalEvent.preventDefault();
              var insertContent = AtUtils.select.choose(cur);

              scope.$apply(function () {
                range = AtUtils.markRange();
                AtUtils.insert(element, scope.content, insertContent, scope.query, range);
                scope.isAtListHidden = true;
              });
              Caret.setPos(element, scope.query.headPos + insertContent.length + 1);

              break;
          }
        }
      });
    }
  };
});