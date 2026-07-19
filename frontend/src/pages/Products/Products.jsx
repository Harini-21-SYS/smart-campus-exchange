import { useNavigate } from "react-router-dom";

function Products() {

  const navigate = useNavigate();

  const handleLogout = () => {

    localStorage.clear();

    navigate("/auth");
  };

  return (
    <div>

      <h1>Products Page</h1>

      <p>Login Success</p>

      <button onClick={handleLogout}>
        Logout
      </button>

    </div>
  );
}

export default Products;