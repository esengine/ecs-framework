/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

module FUI.sc {

	export class UI_View_sc extends fairygui.GComponent {
		public m_list_sc:fairygui.GList;
		public static URL:string = "ui://m4sln17ak7mf0";

		public static createInstance():UI_View_sc {
			return <UI_View_sc>(fairygui.UIPackage.createObject("sc", "View_sc"));
		}

		protected constructFromXML(xml:any):void {
			super.constructFromXML(xml);

			this.m_list_sc = <fairygui.GList>(this.getChildAt(0));
		}
	}
}