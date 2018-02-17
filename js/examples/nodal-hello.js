'use strict';

var HELLO_COMPONENT = "\n\nvar HelloMessage = React.createClass({\n  getInitialState: function() {\n    return {username: ''};\n  },\n\n  componentDidMount: function() {\n\n    this.serverRequest = $.get(this.props.source, function (result) {\n      var lastUser = result.data[result.data.length - 1];\n      var nextUserId = lastUser ? lastUser.id + 1 : 1;\n      var nextUserName = 'user_' + nextUserId;\n\n      var postData = {\n        username: nextUserName,\n        email: nextUserName + '@domain.com',\n        password: nextUserName + 'r0x'\n      };\n\n      $.post(this.props.source, postData, function(result){\n        ClientStorage.setItem('username',result.data[0].username);\n        this.setState({username: ClientStorage.getItem('username')});\n      }.bind(this))\n      .fail(function(jqXHR, textStatus, errorThrown){\n        console.error(jqXHR.responseText);\n      });\n\n    }.bind(this));\n\n  },\n\n  componentWillUnmount: function() {\n    this.serverRequest.abort();\n  },\n\n  render: function() {\n    return <div>Hello {this.state.username}!</div>;\n  }\n});\n\nReactDOM.render(<HelloMessage source='http://localhost:3000/v1/users/' />, mountNode);\n";



ReactDOM.render(React.createElement(ReactPlayground, { codeText: HELLO_COMPONENT }), document.getElementById('helloExample'));


//sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/\\n/g' nodal-hello-source.js | sed -e "s/.*/\"\\\n&\\\n\"/" > nodal-hello-string.js

/*
For now, feed nodal-hello-source.js to that insane sed one liner up there...

Then paste the output nodal-hello-string.js into the var EXAMPLE_COMPONENT

Hah. Totally insane. Fix this for later. Or do it once, and hide it. Or something. Jesus.

*/
