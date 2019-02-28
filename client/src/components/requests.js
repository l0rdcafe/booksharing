import React from "react";
import { Link } from "react-router-dom";
import Typography from "@material-ui/core/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";

class Requests extends React.Component {
  constructor() {
    super();
    this.state = { loading: true };
  }
  async componentDidMount() {
    try {
      const res = await fetch("/requests");
      const result = await res.json();
      const { requests } = result;
      console.log(result);
      this.setState({ requests });
    } catch (e) {
      this.setState({ error: e.message });
    }
    this.setState({ loading: false });
  }
  render() {
    const { loading, requests, error } = this.state;
    return (
      <div>
        {loading && <Typography variant="body2">Loading...</Typography>}
        {!loading && error && <Typography variant="body1" color="error">{error}</Typography>}
        {!loading && !requests.length && <Typography variant="display2">There are no requests. Click below to share a book.</Typography>}
        {!loading && requests.length > 0 &&
          <List>
            {requests.map(req => (
              <ListItem key={req.id}>
                <ListItemText primary={
                  <div style={{ display: "flex" }}>
                    <Typography variant="body1" align="center" style={{ flex: 1 }}><strong>{req.to.username}</strong> wants to give:</Typography>
                    <Typography variant="body1" align="center" style={{ flex: 1 }}>in exchange for <strong>{req.from.username}</strong>'s:</Typography>
                  </div>}
                  secondary={
                  <div style={{ display: "flex", borderRadius: "2px", border: "2px solid #ddd" }}>
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
                  </div>}
                />
              </ListItem>
            ))}
          </List>}
          <Link to="/requests/new" href="/requests/new">
            <Button variant="outlined">New Request</Button>
        </Link>
      </div>
    );
  }
}

export default Requests;
