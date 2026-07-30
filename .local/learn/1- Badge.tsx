//here we create one reusable UI component

// we start by defining the props (information that the component will receive)
type BadgeProps = {
  children: React.ReactNode; // evey badge must receive a child (<badge>Yoga</badge> -> Yoga is the childred)
                             // React.ReactNode mean it accepts any type of children (string, number, element, etc.)
  variant?: "default" | "live" | "solid"; // variant is just a variable name
                                          // ? means it is optional
                                          // | means it can be one of the following values
                                          // "default" | "live" | "solid" are the possible values
                                          // so variant can be only one of these values otherwise it will be "default"
  className?: string;                     // className is optional and it can be only a string
                                          // if we don't provide a className, it will be an empty string
                                          // for example: <badge className="bg-red-500">Yoga</badge>
                                          // it will add the class "bg-red-500" to the badge which means 
                                          // the badge will have a background color of red
};


// export means other files can import this component
// function Badge is like a function that returns a UI component
// like this we create a reusable UI component
// { children, variant = "default", className = "" } -> these are props (inputs for the function)
// children is the child of the badge that we receive from the parent
// variant is the variant of the badge that we receive from the parent and if we don't provide a variant, it will be "default"
// className is the className of the badge that we receive from the parent and if we don't provide a className, it will be an empty string mean no class
// : BadgeProps means the when we call the function, we must pass the props in the correct order and type
// we define the BadgeProps above

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {

  // we create a variable called variantClasses
  // {} makes a javascript object
  // in this object we store badge styles for each variant
  // default is like a key or a variable name
  // "bg-[var(--surface)] text-[var(--text)] border border-[var(--surface-border)]" is a value of default
  // so variantClasses.default will return "bg-[var(--surface)] text-[var(--text)] border border-[var(--surface-border)]"
  //it is tailwind css
  // it is contain of 4 classes:
  // 1. bg-[var(--surface)] -> background color of the badge
  // 2. text-[var(--text)] -> text color of the badge
  // 3. border border-[var(--surface-border)] -> border color of the badge

  // so for example for bg-[var(--surface)] -> it will go to the global css and find the --surface
  // then it will find the --surface color and use it for the background color of the badge
  // var(--surface) mean give me the value stored in --surface variable in the global css
  // in global css we have --surface, like in .footer or .card and ...
  // it will use the one which is active.
  

  const variantClasses = {
    default:
      "bg-[var(--surface)] text-[var(--text)] border border-[var(--surface-border)]",
    live: "bg-red-600 text-white",
    solid: "bg-[var(--text)] text-[var(--surface)]",
  };

  // span is like creating a box or a container to put some stuff inside it
  // [] makes an array of strings
  // first string a tailwind css class which returns our badge styles for the variant
  // this is the styles every badge always has no matter if it is default, live or solid
  // second string is the variantClasses[variant] which returns the styles for the variant
  // like if it is default, live or solid
  // third string is the className which returns the className of the badge
  // like if we have className="bg-red-500", if we have no className, it will be an empty string
  // join(" ") is a javascript function, it joins the strings in the array with a space
  // for example: ["bg-red-500", "bg-blue-500", "bg-green-500"] will be:
  // "bg-red-500 bg-blue-500 bg-green-500"
  // {children} is the children of the badge
  // this is the content of the span which is the children of the badge and
  // get all this things from span

  
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
