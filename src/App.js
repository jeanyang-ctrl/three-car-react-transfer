// import logo from './logo.svg';
import {BrowserRouter as Router,Route,Link} from 'react-router-dom'
// import SdMap from './pages/sdMap'
import SdLine from './pages/sdLine'
// import './App.css';

function App() {
  return (
    <Router>
    <div className="App">
     {/* <Link to="/sdmap">3d地图</Link> */}
     <Link to="/sdline">3d地图</Link>
     {/* <Route path="/sdmap" component={SdMap}></Route> */}
     <Route path="/sdline" component={SdLine}></Route>
    </div>
    </Router>
  );
}

export default App;
