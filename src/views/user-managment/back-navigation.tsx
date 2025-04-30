import { useRouter } from "next/navigation";
import { Button} from "@mui/material";
import { LeftOutlined } from "@ant-design/icons";

export default function BackNav(){
     //back navigate 
          const router = useRouter();
      
          const handleClick = () =>{
            router.push('/')
          }
    return <Button startIcon={<LeftOutlined/>}  onClick={handleClick} >Back to dashboard</Button>

}