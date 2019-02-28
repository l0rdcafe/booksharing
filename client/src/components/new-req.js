import React from "react";
import Typography from "@material-ui/core/Typography";
import FormControl from "@material-ui/core/FormControl";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Paper from "@material-ui/core/Paper";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";

class NewReq extends React.Component {
  constructor() {
    super();
    this.state = { loading: true, booksGiven: [], booksTaken: [] };
  }
  async componentDidMount() {
    try {
      const res = await fetch("/requests/new", {
        credentials: "include"
      });

      const result = await res.json();
      if (res.status === 200) {
        this.setState({ ...result, loading: false });
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      this.setState({ error: e.message, loading: false });
    }
  }
  handleChange = e => {
    this.setState({ [e.target.name]: e.target.value, error: null });
  }
  handleRequest = async () => {
    const booksGiven = this.state.booksGiven.map(b => b.id);
    const booksTaken = this.state.booksTaken.map(b => ({ id: b.id, ownerId: b.owner_id }));
    try {
      const res = await fetch("/requests", {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        method: "POST",
        body: JSON.stringify({ booksGiven, booksTaken })
      });

      if (res.status === 201) {
        this.props.history.push("/requests");
      } else {
        const result = await res.json();
        throw new Error(result.error);
      }
    } catch (e) {
      this.setState({ error: e.message });
    }
  }
  addBook = e => {
    const booksType = e.target.getAttribute("data-books-type");
    const bookDirection = booksType === "booksGiven" ? "toBook" : "fromBook";
    const bookArr = bookDirection === "toBook" ? this.state.userBooks : this.state.otherBooks;
    const [book] = bookArr.filter(b => b.id === this.state[bookDirection]);
    if (!book) {
      return this.setState({ error: `Please select a book to ${bookDirection === "toBook" ? "give" : "take" }.` });
    }

    const isSelected = this.state[booksType].some(b => b.id === book.id);
    if (isSelected) {
      return this.setState({ error: `${book.title} already selected to ${bookDirection === "toBook" ? "give" : "take"}.` });
    }

    const isSameOwner = this.state[booksType].every((b, i, arr) => b.owner_id === arr[0].owner_id);
    if (!isSameOwner) {
      return this.setState({ error: "Books requested to take have to belong to same owner." });
    }

    this.setState({ [booksType]: [book, ...this.state[booksType]] });
  }
  deleteBook = e => {
    const booksType = e.target.getAttribute("data-books-type");
    const id = e.target.getAttribute("data-book-id");
    const updatedBooks = this.state[booksType].filter(book => book.id !== Number(id));
    this.setState({ [booksType]: [...updatedBooks] });
  }
  render() {
    const { loading, userBooks, otherBooks, error, fromBook, toBook, booksGiven, booksTaken } = this.state;
    const { user } = this.props;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {loading && <Typography variant="body2">Loading...</Typography>}
        {!loading && userBooks.length > 0 &&
        <form method="POST" action="/requests" style={{ width: "70%" }}>
          <FormControl style={{ width: "50%" }}>
            <Typography align="center" variant="body1"><strong>{user.username}</strong> wants to trade:</Typography>
            {userBooks.length > 0 &&
            <Select style={{ width: "60%", alignSelf: "center" }} value={toBook || ""} onChange={this.handleChange} inputProps={{ name: "toBook", id: "toBook" }}>
                {userBooks.map(book => (
                 <MenuItem key={book.id} value={book.id}>{book.title}</MenuItem>
                ))}
              </Select>}
            {userBooks.length > 0 && <Button style={{ width: "20%", alignSelf: "center" }} data-books-type="booksGiven" variant="outlined" onClick={this.addBook}>Add</Button>}
            </FormControl>
            <FormControl style={{ width: "50%" }}>
              <Typography align="center" variant="body1">For the following book(s)</Typography>
              {otherBooks.length > 0 &&
              <Select style={{ width: "60%", alignSelf: "center" }} value={fromBook || ""} onChange={this.handleChange} inputProps={{ name: "fromBook", id: "fromBook" }}>
                {otherBooks.map(book => (
                  <MenuItem key={book.id} value={book.id}>{book.title}</MenuItem>
                ))}
              </Select>}
              {otherBooks.length > 0 && <Button style={{ width: "20%", alignSelf: "center" }} data-books-type="booksTaken" variant="outlined" onClick={this.addBook}>Add</Button>}
            </FormControl>
          </form>}
          {!loading && error && <Typography color="error" variant="body2">{error}</Typography>}
          <Paper style={{ display: "flex", width: "80%", marginTop: "2%" }}>
          <div style={{ width: "50%", borderRight: "1px solid grey" }}>
            <Typography align="center" variant="body2"><strong>{user.username}</strong> is offering:</Typography>
            {booksGiven.length > 0 &&
            <List>
              {booksGiven.map(book => (
                <ListItem key={book.id}>
                  <ListItemText primary={book.title} secondary={book.description} />
                  <IconButton aria-label="Delete" data-books-type="booksGiven" data-book-id={book.id} onClick={this.deleteBook}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItem>
              ))}
            </List>}
            {!booksGiven.length && <Typography align="center" variant="body1">No books to give.</Typography>}
          </div>
          <div style={{ width: "50%", borderLeft: "1px solid grey" }}>
            <Typography align="center" variant="body2"><strong>{user.username}</strong> is requesting:</Typography>
            {booksTaken.length > 0 &&
            <List>
              {booksTaken.map(book => (
                <ListItem key={book.id} >
                  <ListItemText primary={book.title} secondary={book.description} />
                  <Typography variant="body1">from <strong>{book.username}</strong></Typography>
                  <IconButton aria-label="Delete" data-books-type="booksTaken" data-book-id={book.id} onClick={this.deleteBook}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItem>
              ))}
            </List>}
            {!booksTaken.length && <Typography align="center" variant="body1">No books to take.</Typography>}
          </div>
        </Paper>
        {!loading && !userBooks.length && <Typography variant="body2">You don't have any books available to trade.</Typography>}
        {!loading && !otherBooks.length && <Typography variant="body2">No books available to request for trade.</Typography>}
        {booksGiven.length > 0 && booksTaken.length > 0 && <Button variant="outlined" onClick={this.handleRequest}>Request Trade</Button>}
      </div>
    );
  }
}

export default NewReq;
