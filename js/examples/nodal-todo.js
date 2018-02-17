'use strict';

var TODO_COMPONENT = "\nvar TodoList = React.createClass({\n  render: function() {\n    var createItem = function(item) {\n      return <li key={item.id}>{item.text}</li>;\n    };\n    return <ul>{this.props.items.map(createItem)}</ul>;\n  }\n});\nvar TodoApp = React.createClass({\n  getInitialState: function() {\n    return {items: [], text: '', username:''};\n  },\n  onChange: function(e) {\n    this.setState({text: e.target.value});\n  },\n  handleSubmit: function(e) {\n    e.preventDefault();\n    var nextItems = this.state.items.concat([{text: this.state.text, id: Date.now()}]);\n    var nextText = '';\n    this.setState({items: nextItems, text: nextText});\n\n    console.log('component state',this.state.items);\n\n    var payload = {\n      todo_list: JSON.stringify(this.state.items),\n    }\n\n    $.post(this.props.url,payload,function(result){\n      console.log('POST response',result);\n    }.bind(this))\n\n  },\n\n  componentDidMount: function(){\n    var user = ClientStorage.getItem('username');\n    this.setState({username: user});\n\n    this.serverRequest = $.get(this.props.url,function(result){\n      var persistedState = result.data[result.data.length - 1];\n      console.log(persistedState.todo_list);\n      this.setState({items: persistedState.todo_list, text: ''});\n\n    }.bind(this));\n\n\n  },\n\n   componentWillUnmount: function() {\n    this.serverRequest.abort();\n  },\n\n  render: function() {\n    return (\n      <div>\n        <h3>{this.state.username} TODO's</h3>\n        <TodoList items={this.state.items} />\n        <form onSubmit={this.handleSubmit}>\n          <input onChange={this.onChange} value={this.state.text} />\n          <button>{'Add #' + (this.state.items.length + 1)}</button>\n        </form>\n      </div>\n    );\n  }\n});\n\nReactDOM.render(<TodoApp url={'http://localhost:3000/v1/todos/'}/>, mountNode);\n";


ReactDOM.render(React.createElement(ReactPlayground, { codeText: TODO_COMPONENT }), document.getElementById('todoExample'));

//sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/\\n/g' nodal-todo-source.js | sed -e "s/.*/\"\\\n&\\\n\"/" > nodal-todo-string.js
/*
For now, feed nodal-todo-source.js to that insane sed one liner up there...

Then paste the output nodal-todo-string.js into the var EXAMPLE_COMPONENT

Hah. Totally insane. Fix this for later. Or do it once, and hide it. Or something. Jesus.

*/
