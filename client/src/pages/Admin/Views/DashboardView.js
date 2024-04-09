import styles from "../../../CSS/Admin/Views/DashboardView.module.css";

const DashboardView = () => {
  return (
    <div className={styles.dashboardView}>
      <h1>Dashboard</h1>
      <h3>Settings</h3>
      <form>
        <p>Lock all teachers from creating classes</p>
        <input type="radio" />
        <label>Yes</label>
        <input type="radio" />
        <label>No</label>
        <p>Lock all teachers from deleting classes</p>
        <input type="radio" />
        <label>Yes</label>
        <input type="radio" />
        <label>No</label>
        <p>Lock all students from leaving classes</p>
        <input type="radio" />
        <label>Yes</label>
        <input type="radio" />
        <label>No</label>
        <p>Lock all students from joining classes</p>
        <input type="radio" />
        <label>Yes</label>
        <input type="radio" />
        <label>No</label>
        <p>
          Fill up available classes in a block with students who have not joined a class in that
          block
        </p>
        <button>OK</button>
        <p>Send the day schedule to students email</p>
        <button>Send</button>
      </form>

      <br />
      <hr />
      <br />

      <h3>Statistics</h3>
      <p>Total classes: 50</p>
      <ul>
        <li>Block 1: 10</li>
        <li>Block 2: 10</li>
        <li>Block 3: 10</li>
        <li>Block 4: 10</li>
        <li>Block 5: 10</li>
        <li>Block 6: 0</li>
      </ul>

      <br />

      <p>Student's who have joined a class for every block: 50</p>
      <ul>
        <div>
          <li>
            Riyad Rzayev <button>More Info</button>
          </li>
        </div>
        <div>
          <li>
            Javid Rzayev <button>More Info</button>
          </li>
        </div>
      </ul>

      <br />

      <p>Student's who have not joined a class for every block: 50 </p>
      <ul>
        <div>
          <li>
            Riyad Rzayev <button>More Info</button>
          </li>
        </div>
        <div>
          <li>
            Javid Rzayev <button>More Info</button>
          </li>
        </div>
      </ul>
    </div>
  );
};

export default DashboardView;
