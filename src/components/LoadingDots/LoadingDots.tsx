import '@components/LoadingDots/LoadingDots.css';

function LoadingDots() {
   return (
      <span className="loading-dots" aria-hidden="true">
         <span>.</span>
         <span>.</span>
         <span>.</span>
      </span>
   );
}

export default LoadingDots;
