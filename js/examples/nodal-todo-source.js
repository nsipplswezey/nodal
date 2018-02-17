var TodoList = React.createClass({
  render: function() {
    var createItem = function(item) {
      return <li key={item.id}>{item.text}</li>;
    };
    return <ul>{this.props.items.map(createItem)}</ul>;
  }
});
var TodoApp = React.createClass({
  getInitialState: function() {
    return {items: [], text: '', username:''};
  },
  onChange: function(e) {
    this.setState({text: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var nextItems = this.state.items.concat([{text: this.state.text, id: Date.now()}]);
    var nextText = '';
    this.setState({items: nextItems, text: nextText});

    console.log('component state',this.state.items);

    var payload = {
      todo_list: JSON.stringify(this.state.items),
    }

    $.post(this.props.url,payload,function(result){
      console.log('POST response',result);
    }.bind(this))

  },

  componentDidMount: function(){
    var user = ClientStorage.getItem('username');
    this.setState({username: user});

    this.serverRequest = $.get(this.props.url,function(result){
      var persistedState = result.data[result.data.length - 1];
      console.log(persistedState.todo_list);
      this.setState({items: persistedState.todo_list, text: ''});

    }.bind(this));


  },

   componentWillUnmount: function() {
    this.serverRequest.abort();
  },

  render: function() {
    return (
      <div>
        <h3>{this.state.username} TODO's</h3>
        <TodoList items={this.state.items} />
        <form onSubmit={this.handleSubmit}>
          <input onChange={this.onChange} value={this.state.text} />
          <button>{'Add #' + (this.state.items.length + 1)}</button>
        </form>
      </div>
    );
  }
});

ReactDOM.render(<TodoApp url={'http://localhost:3000/v1/todos/'}/>, mountNode);
