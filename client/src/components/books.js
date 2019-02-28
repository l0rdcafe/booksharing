import React from "react";
import { Text } from "rebass";
import { Link } from "react-router-dom";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";

class Books extends React.Component {
  constructor() {
    super();
    this.state = { loading: true }
  }
  async componentDidMount() {
    try {
      const res = await fetch("/books");
      const result = await res.json();
      const { books } = result;
      console.log(result)
      this.setState({ books });
    } catch (e) {
      this.setState({ error: "Could not fetch books" });
    }
    this.setState({ loading: false });
  }
  handleDelete = async e => {
    const bookId = e.target.getAttribute("data-book-id");
    try {
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
        throw new Error("Cannot delete book as it is requested in a trade");
      }
    } catch (e) {
      this.setState({ error: e.message });
    }
  }
  render() {
    const { loading, error, books } = this.state;
    const { userId } = this.props;
    console.log(this.state)
    return (
      <div>
        {loading && <Text fontSize={[1, 2, 3]}>Loading...</Text>}
        {!loading && error && <Typography variant="body2" color="error">{error}</Typography>}
        {!loading && !books.length && <Text fontSize={[3, 4, 5]}>There are no books available. Please login or register to add books.</Text>}
        {!loading && books.length > 0 &&
        <List>
          {books.map(book => (
            <ListItem key={book.id}>
              <ListItemText primary={book.title}
                secondary={
                <React.Fragment>
                  <React.Fragment>{book.description}</React.Fragment>
                  <br />
                  <React.Fragment>Created by <strong>{book.username}</strong></React.Fragment>
                  <br />
                  On {Date(book.created_at).toLocaleString()}
                  <br />
                  {book.location ? `At ${book.location}` : "Somewhere unknown"}
                </React.Fragment>
              } />
              {userId === book.owner_id &&
              <IconButton aria-label="Delete" data-book-id={book.id} onClick={this.handleDelete}>
                <DeleteIcon fontSize="small" />
              </IconButton>}
            </ListItem>
          )
        )}
        </List>}
        <Link to="/me" href="/me">
          <Button variant="outlined">New Book</Button>
        </Link>
      </div>
    );
  }
}

export default Books;
