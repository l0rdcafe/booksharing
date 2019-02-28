import React from "react";
import { Link } from "react-router-dom";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";

class Me extends React.Component {
  constructor() {
    super();
    this.state = { loading: true };
  }
  async componentDidMount() {
    try {
      const res = await fetch("/me", {
        credentials: "include"
      });

      const result = await res.json();
      console.log(result);
      if (res.status === 200) {
        this.setState({ loading: false, books: result.books, user: result.user, requests: result.requests });
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      this.setState({ error: e.message, loading: false });
    }
  }
  handleChange = name => e => {
    this.setState({ [name]: e.target.value, error: null });
  }
  handleDelete = async e => {
    try {
      const bookId = e.target.getAttribute("data-book-id");
      const res = await fetch("/books", {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bookId }),
        method: "DELETE"
      });

      if (res.status === 204) {
        const updatedBooks = this.state.books.filter(book => book.id !== Number(bookId));
        this.setState({ books: updatedBooks });
      } else {
        const result = await res.json();
        console.log(result)
        throw new Error(result.error);
      }
    } catch (e) {
      this.setState({ error: "Could not delete book as it is requested in a book trade." });
    }
  }
  handleSubmit = async () => {
    const { title, description } = this.state;
    if (!title) {
      return this.setState({ error: "You must provide a book title" });
    }

    if (!description) {
      return this.setState({ error: "Book description required" });
    }

    try {
      const res = await fetch("/books", {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, description }),
        method: "POST"
      });

      const result = await res.json();
      if (res.status === 200) {
        this.setState({ books: [result, ...this.state.books] });
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
        this.setState({ error: e.message });
    }
  }
  handleAcceptReq = async (e) => {
    const tradeId = e.target.getAttribute("data-trade-id");
    try {
      const res = await fetch("/requests", {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        method: "PUT",
        body: JSON.stringify({ tradeId })
      });

      if (res.status === 200) {
        this.props.history.push("/trades");
      } else {
        const result = await res.json();
        throw new Error(result.error);
      }
    } catch (e) {
      this.setState({ error: e.message });
    }
  }
  render() {
    const { loading, title, description, books, error, requests } = this.state;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <form method="POST" action="/books" style={{ display: "flex", flexDirection: "column", alignContent: "center" }}>
          <TextField placeholder="Book title" label="Title" id="title" onChange={this.handleChange("title")} required margin="dense" value={title || ""} />
          <TextField placeholder="Author, description, etc..." label="Description" id="description" onChange={this.handleChange("description")} required margin="dense" value={description || ""} />
          <Button variant="outlined" onClick={this.handleSubmit}>Create</Button>
        </form>
        {!loading && !books.length && <Typography variant="body1">You have no books. Add one to share it with friends.</Typography>}
        {!loading && books.length > 0 &&
          <List>
            {books.map(book => (
              <ListItem key={book.id}>
                <ListItemText primary={book.title} secondary={book.description} />
                <IconButton aria-label="Delete" data-book-id={book.id} onClick={this.handleDelete}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
          </List>
        }
        {!loading && !requests.length && <Typography variant="body1">You have no pending book trade requests.</Typography>}
        {!loading && requests.length > 0 &&
        <React.Fragment>
        <Typography variant="headline">Pending:</Typography>
        <List style={{ width: "75%", paddingTop: 0 }}>
          {requests.map(req => (
            <ListItem key={req.tradeId} style={{ padding: 0, border: "2px solid #ddd", borderRadius: "2px" }}>
              <ListItemText style={{ padding: 0 }} primary={
                <div style={{ display: "flex", borderBottom: "2px solid #ccc" }}>
                  <Typography align="center" style={{ flex: 1 }} variant="body1"><strong>{req.to.username}</strong> wants to give you:</Typography>
                  <Typography align="center" style={{ flex: 1 }} variant="body1">In exchange for:</Typography>
                </div>}
                secondary={
                <div style={{ display: "flex", padding: 0 }}>
                  <List style={{ flex: 1, borderRight: "1px solid #ccc" }}>
                    {req.to.books.map(book => (
                      <ListItem key={book.bookId}>
                        <ListItemText primary={book.title} secondary={book.description} />
                      </ListItem>
                    ))}
                  </List>
                  <List style={{ flex: 1, borderLeft: "1px solid #ccc" }}>
                    {req.from.books.map(book => (
                    <ListItem key={book.bookId}>
                      <ListItemText primary={book.title} secondary={book.description} />
                    </ListItem>
                    ))}
                  </List>
                <Button style={{ color: "#fff", backgroundColor: "#3d9970", borderRadius: 0, border: 0 }} data-trade-id={req.tradeId} variant="outlined" onClick={this.handleAcceptReq}>Accept</Button>
                </div>
              } />
            </ListItem>
          ))}
        </List>
        </React.Fragment>
        }
        {loading && <Typography variant="body2">Loading...</Typography>}
        {error && <Typography variant="body2" color="error">{error}</Typography>}
        <Link to="/requests/new" href="/requests/new">
          <Button variant="outlined">New Request</Button>
        </Link>
      </div>
    );
  }
}

export default Me;
