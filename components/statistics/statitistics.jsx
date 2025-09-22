const SERACH_ICON = (
  <svg
    className="icon icon_search"
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="M21 21L17.5001 17.5M20 11.5C20 16.1944 16.1944 20 11.5 20C6.80558 20 3 16.1944 3 11.5C3 6.80558 6.80558 3 11.5 3C16.1944 3 20 6.80558 20 11.5Z"
      stroke="#FFBB00"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M21 21L17.5001 17.5M20 11.5C20 16.1944 16.1944 20 11.5 20C6.80558 20 3 16.1944 3 11.5C3 6.80558 6.80558 3 11.5 3C16.1944 3 20 6.80558 20 11.5Z"
      stroke="black"
      stroke-opacity="0.2"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const CHECKBOX_ICON = (
  <svg
    className="icon icon_checkbox"
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="M10 3L4.5 8.5L2 6"
      stroke="white"
      stroke-width="1.6666"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const CHEVDOWN_ICON = (
  <svg
    className="icon icon_chevdown"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
  >
    <path
      d="M4.25 6.125L8 9.875L11.75 6.125"
      stroke="#FFBB00"
      stroke-width="0.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const CONVERTION_AVAIL = [
  {
    amount: 625,
    status: "possible convert",
  },
  {
    amount: 842,
    status: "possible convert",
  },
];

export function Statistics() {
  return (
    <div id="statsistics" className="statistics">
      <div className="left">
        <div className="header">
          <div className="input input_search">
            {SERACH_ICON}
            <input type="text" placeholder="search assest" />
          </div>
          <div className="input input_filter">
            <span className="label">filter</span>
            {CHEVDOWN_ICON}
          </div>
          <div className="input input_shorts">
            <span className="label">shorts</span>
            {CHEVDOWN_ICON}
          </div>
        </div>
      </div>
      <div className="right">
        <ul className="convertion_container">
          {CONVERTION_AVAIL.map((transaction, i) => {
            return (
              <div key={i} className="convertion">
                <p className="amount">${transaction.amount}</p>
                <p className="status">{transaction.status}</p>
              </div>
            );
          })}
        </ul>
        <button className="btn btn_convert">convert</button>
      </div>
    </div>
  );
}
