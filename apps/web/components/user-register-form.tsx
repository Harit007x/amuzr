"use client";
import * as React from "react";
import { cn } from "@repo/ui/utils";
// import { userRegisterSchema } from "../actions/user/schema";
// import { createUser } from "../actions/user/user-actions";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function UserRegisterForm({ className, ...props }: UserAuthFormProps) {
  // const [isLoading, setIsLoading] = React.useState<boolean>(false);

  // async function onSubmit(formData: z.infer<typeof userRegisterSchema>) {
  //   setIsLoading(true);
  //   const res = await createUser(formData);

  //   if (!res?.error) {
  //     toast.success(res.message);
  //     router.push('/login');
  //   } else {
  //     console.log('toasted');
  //     toast.error(res.error, {
  //       action: {
  //         label: 'Close',
  //         onClick: () => console.log('Closed Toast'),
  //       },
  //     });
  //   }
  //   setIsLoading(false);
  // }

  // const form = useForm<z.infer<typeof userRegisterSchema>>({
  //   resolver: zodResolver(userRegisterSchema),
  //   defaultValues: {
  //     first_name: "",
  //     last_name: "",
  //     username: "",
  //     password: "",
  //   },
  // });

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      
      {/* <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div> */}
    </div>
  );
}
