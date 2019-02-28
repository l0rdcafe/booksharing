import React from "react";
import { Box, Flex } from "rebass";
import { Link } from "react-router-dom";
import Typography from "@material-ui/core/Typography";

const Nav = ({ loading, isLoggedIn, logout }) => (
  <Flex>
    <Box width={1/6} bg="magenta" p={3}>
      <Link to="/" href="/">BookCare</Link>
    </Box>
    <Box width={4/6} p={3} bg="silver">
      <Link to="/books" mx={2} href="/books">Books</Link>
      <Link to="/requests" mx={2} href="/requests">Requests</Link>
      <Link to="/trades" mx={2} href="/trades">Trades</Link>
      <Link to="/users" mx={2}  href="/users">Users</Link>
    </Box>
    {!isLoggedIn && !loading &&
    <Box width={1/6} bg="magenta" p={3}>
      <Link to="/login" mx={2} href="/login">Login</Link>
      <Link to="/register" mx={2} href="/register">Register</Link>
    </Box>
    }
    {isLoggedIn && !loading  &&
    <Box width={2/6} bg="magenta" p={3}>
      <Link to="/" href="/" onClick={logout} mx={2}>Logout</Link>
      {isLoggedIn && !loading && <Link to="/me" mx={2} href="/me">Me</Link>}
    </Box>}
    {loading &&
    <Box width={2/6} bg="magenta" p={3}>
      <Typography variant="body2">Loading...</Typography>
    </Box>
    }
  </Flex>
);

export default Nav;
